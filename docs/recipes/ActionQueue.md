# Action Queue

## Building a simple action queue

Sometimes it might be desirable to dynamically add commands to a queue and
handle each one in succession. Let's say for example we want to be able to
drag tasks on a taskboard. Whenever a drag movement ends, we have to send the
new position of the task to the server as well, so that it persists on a page reload.
If our request fails we want to roll back and put the task at its source position.
But what happens if we drag multiple tasks in quick succession?
Because of their asynchronous nature requests could resolve in any order.
Meaning we might produce inconsistent states.
There would be no way for us to control in which order our requests resolve,
and because each request is triggered by its own action we cannot make use of
`Cmd.list(cmds, { sequence: true })`.
Instead we need to build a queue ourselves which luckily is quite easy to do with redux-loop.
The example below shows, how you could model your initial state as well as your _QueueReducer_.

```js
const initialState = {
  queue: [],
  error: false,
  //other fields
};

function Reducer (state = initialState, action) {
  switch (action.type) {
    case 'ITEM_DRAGGED': {
      const { queue } = state;
      const { id } = action.payload;

      if(queue.length){ //something is already running so just add a request to the queue
        return {
          ...state,
          queue: queue.concat([id]) //add new request to back of queue
        };
      }

      //nothing is running so just add the new request to the front of the queue and run it
      const newState = {
        ...state,
        queue: [id]
      };

      return loop(newState, Cmd.run(doRequest, {
        args: [id],
        successActionCreator: requestSuccessAction,
        failActionCreator: requestFailAction
      }));
    }

    case 'DRAG_REQUEST_SUCCESS': {
      const newState = {
        ...state,
        queue: state.queue.slice(1) //remove old request from front of queue
      };

      if(!newState.queue.length){
        //no more requests in the queue
        return newState;
      }

      //start the next request
      return loop(newState, Cmd.run(doRequest, {
        args: [newState.queue[0]],
        successActionCreator: requestSuccessAction,
        failActionCreator: requestFailAction
      }));
    }

    case 'DRAG_REQUEST_FAILURE': {
      return {
        ...state,
        queue: [], //clear queue on failure
        error: true
      }
    }

    default: {
      return state;
    }
  }
};
```


## Handling different kinds of actions

Sometimes you might want to queue different kinds of actions.
To achieve this, we could build a `QueueReducer` that listens for specific properties
instead of an `action.type`:

```js
function QueueReducer (state = [], action) {
  if (action.queuedAction) {
    // add to queue and potentially dispatch the action with Cmd.action if the
    // queue was empty before
    if (state.length) { //something is already running so just add the action to the queue
      return state.concat([action]);
    }

    // nothing is running so just add the new action to the front of the queue and run it
    const newState = [action];

    return loop(newState, Cmd.action(action));
  } else if (action.queueSuccess) {
    // remove action from queue (FIFO) and potentially continue
    const newState = state.slice(1)

    if(!newState.length){
      // no more requests in the queue
      return newState;
    }

    // dispatch next axtion
    return loop(newState, Cmd.action(action));
  } else if (action.queueFail) {
    return [];
  }

  return state;
}

function DraggingReducer (state, action) {
  switch (action.type) {
    case 'ITEM_DRAGGED': {
      // update the state according to the dragging changes
      // (the function below is just an example)
      return updateDraggedState(state, action);
    }

    case 'DRAG_REQUEST': {
      const id = action.payload;

      return loop(state, Cmd.run(doRequest, {
        args: [id],
        successActionCreator: () => dragRequestSuccess(id),
        failActionCreator: () => dragRequestFailure(state) // old state to roll back on failure
      }));
    }

    case 'DRAG_REQUEST_FAILURE': {
      const oldState = action.payload;
      return oldState
    }

    default: {
      return state;
    }
  }
}
```

Now if we want to add a request action to our queue whenever the user drags
a card on our task board, we will dispatch a combined action of the event that
actually occured and the `queuedAction` we want to add to our queue. To make this
a bit easier we create an `attachQueuedAction` function which we can use inside
our action creators:

```js
// Helper actionCreators
export const attachQueuedAction = (action, queuedAction) => {
  return {
    ...action,
    queuedAction // this is the property our QueueReducer is looking for
  };
};

export const attachQueueSuccess = action => {
  return {
    ...action,
    queueSuccess: true // this is the property our QueueReducer is looking for
  }
}

export const attachQueueFail = action => {
  return {
    ...action,
    queueFail: true // this is the property our QueueReducer is looking for
  }
}

// Actual actionCreators
export const makeDragRequest = (id) => ({
  type: 'DRAG_REQUEST',
  payload: id
})

export const itemDragged = id => attachQueuedAction({
  type: 'ITEM_DRAGGED',
  payload: id
}, makeDragRequest(id));

export const dragRequestSuccess = id => attachQueueSuccess({
  type: 'DRAG_REQUEST_SUCCESS',
  payload: id
})

export const dragRequestFailure = (oldState) => attachQueueFail({
  type: 'DRAG_REQUEST_FAILURE',
  payload: oldState
})
```
