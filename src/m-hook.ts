import { useMemo, useState } from 'react';


export const computed: IComputed = ((Class, key, desc) => {
  if (key) {
    return computedDecorator(Class, key, desc);
  }
  return computedFunction(Class);
}) as any;

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

function computedFunction<T>(inner: () => T): () => T {
  let value: any;
  let executed: any;
  const listeners: Set<Observer> = new Set();
  const computedObserver = createObserver({ run });
  function run () {
    computedObserver.clear();
    active.notify(listeners);
    executed = 0;
  }
  return function memoizer() {
    active.add(listeners);
    if (!executed) {
      const prev = activate(computedObserver);
      try {
        value = inner.call(this);
      } finally {
        executed = 1;
        activate(prev);
      }
    }
    return value;
  }
}

interface IComputed {
  <T>(value: () => T): () => T;
  (target: object, key: string | symbol, descriptor?: PropertyDescriptor): any;
}



// Some built-in JS objects mutate themselves in ways we cannot track.
// So we need to hack in observations on these.
export function getMutationHelper(target: object, value: any) {
  if (target instanceof Map || target instanceof Set) {
    return getMutationHelperInner(target, value, 'size');
  } else if (target instanceof Array) {
    return getMutationHelperInner(target, value, 'length');
  }
}

function getMutationHelperInner(target: object, value: any, mutatingKey: string) {
  const listeners = getListenersForKey(target, mutatingKey, true);
  if (typeof value == 'function') {
    return function () {
      const before = target[mutatingKey];
      try {
        return value.apply(target, arguments);
      } finally {
        if (target[mutatingKey] !== before) {
          notifyObservers(listeners);
        }
      }
    };
  }
  addObservation(listeners);
}


export const observable: IObservable = ((Class: any, key: any, desc: any) => {
  if (key) {
    return observableDecorator(Class, key, desc);
  }
  return observableObject(Class);
}) as any;

const observableSym = Symbol();
function observableObject<T extends object>(object: T): T {
  let proxy = object[observableSym];
  if (!proxy) {
    proxy = object[observableSym] = new Proxy(object, { get: getProxyValue, set: setProxyValue });
  }
  return proxy;
}

const observablePropsSym = Symbol();
function observableDecorator(Class, key, desc) {
  const getObservable = (inst: any) => inst[observablePropsSym] || (inst[observablePropsSym] = observable({}));
  return {
    get() {
      const o = getObservable(this);
      if (!(key in o) && desc.initializer) {
        o[key] = desc.initializer();
      }
      return o[key];
    },
    set(value: any) {
      (getObservable(this))[key] = value;
    }
  };
}

function getProxyValue(target: object, key: string | symbol) {
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

function setProxyValue(target: object, key: string | symbol, value: any) {
  const before = target[key];
  target[key] = value;
  const listeners = getListenersForKey(target, key);
  if (listeners && value !== before) {
    active.notify(listeners);
  }
  return true;
}

interface IObservable {
  <T extends object>(value: T): T;
  (target: object, key: string | symbol, descriptor?: PropertyDescriptor): any;
}

export type Observer =  {
  run: () => void;
  on: Set<Set<Observer>>;
  notify(observers: Set<Observer>): void;
  add(observers: Set<Observer>, target?: Observer): void;
  clear(): void;
};

export let active: Observer = createObserver();

export function activate(observer: Observer) {
  if (!observer) {
    throw new Error('invalid activation');
  }
  try {
    return active;
  } finally {
    active = observer;
  }
}

export function createObserver(config?: Partial<Observer>): Observer {
  const self = {
    on: new Set<Set<Observer>>(),
    clear: () => clearObserver(self),
    notify: notifyObservers,
    add: addObservation,
    run: () => {},
    ...config
  };
  return self;
}

export function clearObserver(observer: Observer) {
  if (observer) {
    const set = Array.from(observer.on);
    observer.on.clear();
    for (let observation of set) {
      observation.delete(observer);
    }
  }
}

export function addObservation(listeners: Set<Observer>, observer?: Observer | null | undefined) {
  if (observer === undefined) {
    observer = active;
  }
  if (observer) {
    observer.on.add(listeners);
    listeners.add(observer);
  }
}

export function notifyObservers(observers: Set<Observer>) {
  for (const observer of Array.from(observers)) {
    if (active !== observer) {
      observer.run();
    }
  }
}


export function useObserver<T>(render: () => T): T {
  const [update, setUpdate] = useState(null);

  const observer = useMemo(() => (
    createObserver({
      run: () => {
        observer.clear();
        setUpdate(Object.create(null));
      }
    })
  ), []);

  const previous = activate(observer);
  try {
    return render();
  } finally {
    activate(previous);
  }
}


const listenerSym = Symbol();

export function getListenersForKey(target: object, key: string | symbol, createIfNeeded?: boolean) {
  let listeners = target[listenerSym] || (target[listenerSym] = {});
  let result = listeners[key];
  if (!result && createIfNeeded) {
    result = listeners[key] = new Set<Observer>();
  }
  return result;
}

