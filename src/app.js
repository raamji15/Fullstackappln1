const express = require('express');
const path = require('node:path');
const {
  listClaims,
  createClaim,
  updateClaimStatus,
  getSummary,
  defaultDataFile
} = require('./dataStore');
const { normalizeClaimInput, validateClaimInput, validateStatus } = require('./validation');

function createApp(options = {}) {
  const app = express();
  const dataFile = options.dataFile || process.env.APP_DATA_FILE || defaultDataFile;

  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/api/health', (_request, response) => {
    response.json({ ok: true });
  });

  app.get('/api/claims', async (request, response, next) => {
    try {
      const claims = await listClaims({ status: request.query.status, filePath: dataFile });
      response.json({ claims });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/summary', async (_request, response, next) => {
    try {
      const summary = await getSummary(dataFile);
      response.json(summary);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/claims', async (request, response, next) => {
    try {
      const claimInput = normalizeClaimInput(request.body);
      const errors = validateClaimInput(claimInput);

      if (errors.length > 0) {
        return response.status(400).json({ errors });
      }

      const claim = await createClaim(claimInput, dataFile);
      return response.status(201).json({ claim });
    } catch (error) {
      return next(error);
    }
  });

  app.patch('/api/claims/:id/status', async (request, response, next) => {
    try {
      const status = String(request.body.status || '').toLowerCase().trim();
      const errors = validateStatus(status);

      if (errors.length > 0) {
        return response.status(400).json({ errors });
      }

      const updatedClaim = await updateClaimStatus(request.params.id, status, dataFile);

      if (!updatedClaim) {
        return response.status(404).json({ errors: ['Claim not found.'] });
      }

      return response.json({ claim: updatedClaim });
    } catch (error) {
      return next(error);
    }
  });

  app.use((error, _request, response, _next) => {
    console.error(error);
    response.status(500).json({ errors: ['Unexpected server error.'] });
  });

  return app;
}

module.exports = { createApp };
