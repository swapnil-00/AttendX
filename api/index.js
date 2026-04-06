// Vercel serverless function wrapper
// Install dependencies from server folder
require('dotenv').config();
const app = require('../server/index.js');

module.exports = app;
