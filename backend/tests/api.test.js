const { describe, it } = require('node:test');
const assert = require('node:assert');
const app = require('../index');

describe('API Endpoint Integration Tests', () => {
  it('GET /health returns 200 and healthy status', async () => {
    // Test using standard http request with native node
    const res = await new Promise((resolve, reject) => {
      const server = app.listen(0, () => {
        const port = server.address().port;
        fetch(`http://127.0.0.1:${port}/health`)
          .then((r) => r.json().then((body) => resolve({ status: r.status, body })))
          .catch(reject)
          .finally(() => server.close());
      });
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'healthy');
    assert.ok(typeof res.body.uptime === 'number');
  });

  it('GET /ready returns status code 200 or 503 depending on config', async () => {
    const res = await new Promise((resolve, reject) => {
      const server = app.listen(0, () => {
        const port = server.address().port;
        fetch(`http://127.0.0.1:${port}/ready`)
          .then((r) => r.json().then((body) => resolve({ status: r.status, body })))
          .catch(reject)
          .finally(() => server.close());
      });
    });

    assert.ok(res.status === 200 || res.status === 503);
    assert.ok(res.body.provider);
  });

  it('POST /analyze without a file returns 400 and MISSING_FILE code', async () => {
    const res = await new Promise((resolve, reject) => {
      const server = app.listen(0, () => {
        const port = server.address().port;
        fetch(`http://127.0.0.1:${port}/analyze`, {
          method: 'POST',
        })
          .then((r) => r.json().then((body) => resolve({ status: r.status, body })))
          .catch(reject)
          .finally(() => server.close());
      });
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.code, 'MISSING_FILE');
  });
});
