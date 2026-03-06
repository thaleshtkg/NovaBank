/**
 * Re-exports the backend test helpers from their canonical location in
 * backend/tests/setup.js, which is kept in place so that require.resolve()
 * inside createTestApp() continues to resolve database and route module paths
 * correctly relative to the backend/ directory tree.
 */
module.exports = require('../../backend/tests/setup');
