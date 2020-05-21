
import { observable, observer } from './m';
import React from 'react'

const model = observable({
  counter: 0
})

setInterval(() => model.counter ++, 500);

const increment = () => {
  console.log(model.counter)
  model.counter ++
};
const decrement = () => model.counter --;


export const TestComponent = observer(() => (
  <div>
    <button onClick={decrement}>-</button>
    <span>{model.counter}</span>
    <button onClick={increment}>+</button>
  </div>
));
