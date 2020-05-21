
import { observable, useObserver } from './m-hook';
import React from 'react'


const model = observable({ counter: 0 });
const increment = () => model.counter ++;
const decrement = () => model.counter --;

const Test = () => useObserver(() => {

return (
  <div>
    <h1 style={{ textAlign: 'center' }}>Count: {model.counter}</h1>
    <input type="range" value={model.counter} min={0} max={10} onChange={evt => model.counter = Number(evt.target.value)} style={{ width: '100%' }} />
  </div>
)});

export const TestHook = () => useObserver(() => (
    <div>
        <Test/>
        <button onClick={decrement}>-</button>
        <strong>{model.counter}</strong>
        <button onClick={increment}>+</button>
    </div>
));

