import express from 'express';

const app = express();

app.get('/', function(req, res) {
  const { setupNewStore, Actions } = require('../src/store');
  /**
   * Important!
   * We have to setup new store for each request.
   * Otherwise initial state will stay there from previous request.
   *
   * Optionally we can pass initial state,
   * gathered from URL and other request parameters.
   */
  const store = setupNewStore();

  /**
   * These actions are supposed to be figured out
   * from URL and other request parameters.
   */
  store.dispatch(Actions.incrementBothStart(1));

  /**
   * Have to save link to unsibscribe, to clean up
   * everything in the end
   */
  const unsubscribe = store.subscribe(function() {
    /**
     * We care only about final changes to the store.
     * If there are any effects in the queue then state in not
     * stable yet, and we just wait.
     */
    if (store.isEffectsQueueEmpty()) {
      /**
       * Clean up the listeners
       */
      unsubscribe();
      /**
       * Render response once, based on the state.
       * To this point we assume all the needed requests are done
       * and all the data is gathered.
       */
      const state = store.getState();
      res.send(`${JSON.stringify(state.toJS())}`);
    }
  });
});

module.exports = app;
