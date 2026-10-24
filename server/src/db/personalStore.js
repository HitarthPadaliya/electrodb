/**
 * Store selector.
 *
 * The account features talk to one interface. In production that interface is
 * backed by MySQL; the preview server and the test suite swap in the in-memory
 * implementation so the same services, middleware and routes are exercised
 * without a database.
 */
const config = require('../config');

let store = null;

function getStore() {
  if (!store) {
    store = config.personalStore === 'memory'
      ? require('./personalMemoryStore').createMemoryStore()
      : require('./personalMysqlStore');
  }
  return store;
}

function setStore(next) {
  store = next;
  return store;
}

function useMemoryStore() {
  const { createMemoryStore } = require('./personalMemoryStore');
  return setStore(createMemoryStore());
}

module.exports = { getStore, setStore, useMemoryStore };
