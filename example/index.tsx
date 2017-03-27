import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Store } from 'redux';
import { Provider } from 'react-redux';
import { createLoopStore } from '../modules';
import { App, reducer, initialStateAndEffects } from './App';

const mountNode = document.createElement('div');
document.body.appendChild(mountNode);

const store = createLoopStore(reducer, initialStateAndEffects) as Store<any>;

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  mountNode
);
