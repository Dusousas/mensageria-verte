const { apiKey } = require('../../config/env');

function apiKeyMiddleware(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key || key !== apiKey) {
    return res.status(401).json({ error: 'API Key inválida' });
  }
  next();
}

module.exports = apiKeyMiddleware;
