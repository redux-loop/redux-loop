import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { createLoopStore } from '../../modules';
import * as App from './App';

const mountNode = document.getElementById('root');

const store = createLoopStore(App.reducer, App.init);
store.subscribe(() => renderApp(store.getState()));
renderApp(store.getState());

function renderApp(model: App.Model) {
  ReactDOM.render(
    <App.View model={model} dispatch={store.dispatch} />,
    mountNode
  );
}
