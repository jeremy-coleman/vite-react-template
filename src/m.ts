import {Component} from 'react'

const observerSym = Symbol();
const observablePropsSym = Symbol();
const listenerSym = Symbol();

type Observer = {
    active?: boolean;
    run: () => void;
    on: Set<Set<Observer>> | null;
    notify(observers: Set<Observer>): void;
    add(observers: Set<Observer>, target?: Observer): void;
    clear(observer: Observer): void;
};

let active = createObserver({ on: null });

function activate(observer) {
    const prev = active;
    observer.active = true;
    active = observer;
    return () => {
        observer.active = false;
        active = prev;
    };
}

function createObserver(config) {
    return {
        on: new Set(),
        notify: notifyObservers,
        add: addObservation,
        clear: clearObserver,
        run: () => void 0,
        ...config
    };
}

function clearObserver(observer) {
    if (observer && observer.on) {
        for (let observation of observer.on) {
            observation.delete(observer);
        }
        observer.on.clear();
    }
}

function addObservation(listeners, observer) {
    if (observer === undefined) {
        observer = active;
    }
    if (observer && observer.on) {
        observer.on.add(listeners);
        listeners.add(observer);
    }
}

function notifyObservers(observers: Observer[]) {
    for (const observer of Array.from(observers)) {
        if (!observer.active) {
            observer.run();
        }
    }
}



function getListenersForKey(target, key, createIfNeeded?) {
    let listeners = target[listenerSym] || (target[listenerSym] = {});
    let result = listeners[key];
    if (!result && createIfNeeded) {
        result = listeners[key] = new Set();
    }
    return result;
}

function getMutationHelper(target, value) {
    if (target instanceof Map || target instanceof Set) {
        return getMutationHelperInner(target, value, 'size');
    }
    else if (target instanceof Array) {
        return getMutationHelperInner(target, value, 'length');
    }
}

function getMutationHelperInner(target, value, mutatingKey) {
    const listeners = getListenersForKey(target, mutatingKey, true);
    if (typeof value == 'function') {
        return function () {
            const before = target[mutatingKey];
            try {
                return value.apply(target, arguments);
            }
            finally {
                if (target[mutatingKey] !== before) {
                    active.notify(listeners);
                }
            }
        };
    }
    active.add(listeners);
}

const observable = ((Class, key?, desc?) => {
    if (key) {
        return observableDecorator(Class, key, desc);
    }
    return observableObject(Class);
});
const observableSym = Symbol();
function observableObject(object) {
    let proxy = object[observableSym];
    if (!proxy) {
        proxy = object[observableSym] = new Proxy(object, { get: getProxyValue, set: setProxyValue });
    }
    return proxy;
}



function observableDecorator(Class, key, desc) {
    const getObservable = (inst) => inst[observablePropsSym] || (inst[observablePropsSym] = observable({}));
    return {
        get() {
            const o = getObservable(this);
            if (!(key in o) && desc.initializer) {
                o[key] = desc.initializer();
            }
            return o[key];
        },
        set(value) {
            (getObservable(this))[key] = value;
        }
    };
}

function getProxyValue(target, key) {
    const value = target[key];
    const mutationHelper = getMutationHelper(target, value);
    if (mutationHelper) {
        return mutationHelper;
    }
    if (typeof key != 'symbol') {
        const listeners = getListenersForKey(target, key, true);
        active.add(listeners);
        if (value instanceof Object) {
            return observableObject(value);
        }
    }
    return value;
}

function setProxyValue(target, key, value) {
    const before = target[key];
    target[key] = value;
    const listeners = getListenersForKey(target, key);
    if (listeners && value !== before) {
        active.notify(listeners);
    }
    return true;
}

const computed = ((Class, key, desc) => {
    if (key) {
        return computedDecorator(Class, key, desc);
    }
    return computedFunction(Class);
});

function computedDecorator(Class, key, desc) {
    const sym = Symbol();
    return {
        get() {
            if (!this[sym]) {
                this[sym] = computedFunction(desc.get);
            }
            return this[sym]();
        }
    };
}

function computedFunction(inner) {
    let value;
    let executed;
    const listeners = new Set();
    function run() {
        active.clear(clear);
        active.notify(listeners);
        executed = 0;
    }
    const clear = createObserver({ run });
    return function memoizer() {
        active.add(listeners);
        if (!executed) {
            const done = activate(clear);
            try {
                value = inner.call(this);
            }
            finally {
                executed = 1;
                done();
            }
        }
        return value;
    };
}




function observer(component) {
    const isFunctionComponent = !(component.prototype);
    const inner = (isFunctionComponent ? class SFC extends Component {
        constructor(props) {
            super(props);
            //this.render = component;
        }
    } : component);
    const prototype = inner.prototype;
    const { render, componentWillUnmount } = prototype;
    prototype.componentWillUnmount = function () {
        active.clear(this[observerSym]);
        if (componentWillUnmount) {
            return componentWillUnmount.apply(this, arguments);
        }
    };
    prototype.render = function () {
        const observer = this[observerSym] || (this[observerSym] = createObserver({ 
            //run: () => this.setState({})
            run: () => this.forceUpdate()
        }));
        active.clear(observer);
        if (!this.base || this.base.isConnected) {
            const done = activate(observer);
            try {
                return component(this.props, this.context);
                //return render.apply(this, arguments);
            }
            finally {
                done();
            }
        }
    };
    return inner;
}

export { activate, active, computed, createObserver, observable, observer };
