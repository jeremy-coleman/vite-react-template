import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import {App} from '@coglite/App'

import {TestComponent} from './TestMComponent'
import {TestHook} from './TestMHook'



const Test = () => (
  <div>
    <TestComponent/>
    <TestHook/>
    <App/>
  </div>
)


ReactDOM.render(
  <React.StrictMode>
    <Test />
  </React.StrictMode>,
  document.getElementById('root')
)
