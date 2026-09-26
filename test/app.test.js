const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createApp } = require('../src/app');

async function createTestServer(seedData = { claims: [] }) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'reimbursements-'));
  const dataFile = path.join(tempDir, 'claims.json');
  await fs.writeFile(dataFile, JSON.stringify(seedData, null, 2));

  const app = createApp({ dataFile });
  const server = await new Promise((resolve) => {
    const startedServer = app.listen(0, () => resolve(startedServer));
  });

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    baseUrl,
    dataFile,
    async close() {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  };
}

test('creates and lists reimbursement claims', async () => {
  const harness = await createTestServer();

  try {
    const createResponse = await fetch(`${harness.baseUrl}/api/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeName: 'Taylor Brooks',
        employeeEmail: 'taylor.brooks@example.com',
        department: 'Sales',
        category: 'Travel',
        expenseDate: '2026-09-21',
        amount: 210.5,
        description: 'Flight and taxi reimbursement for partner visit.'
      })
    });

    assert.equal(createResponse.status, 201);
    const createPayload = await createResponse.json();
    assert.equal(createPayload.claim.status, 'pending');

    const listResponse = await fetch(`${harness.baseUrl}/api/claims`);
    const listPayload = await listResponse.json();

    assert.ok(Array.isArray(listPayload.claims));
    assert.equal(listPayload.claims.length, 1);
    assert.equal(listPayload.claims[0].employeeName, 'Taylor Brooks');
  } finally {
    await harness.close();
  }
});

test('updates claim status and reflects it in summary', async () => {
  const harness = await createTestServer({
    claims: [
      {
        id: 'claim-1',
        employeeName: 'Jordan Kim',
        employeeEmail: 'jordan.kim@example.com',
        department: 'Finance',
        category: 'Training',
        expenseDate: '2026-09-14',
        amount: 399.99,
        description: 'Certification course reimbursement request.',
        status: 'pending',
        submittedAt: '2026-09-15T10:00:00.000Z',
        reviewedAt: null
      }
    ]
  });

  try {
    const updateResponse = await fetch(`${harness.baseUrl}/api/claims/claim-1/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' })
    });

    assert.equal(updateResponse.status, 200);
    const updatePayload = await updateResponse.json();
    assert.equal(updatePayload.claim.status, 'approved');

    const summaryResponse = await fetch(`${harness.baseUrl}/api/summary`);
    const summaryPayload = await summaryResponse.json();

    assert.equal(summaryPayload.totalClaims, 1);
    assert.equal(summaryPayload.statusCounts.approved, 1);
    assert.equal(summaryPayload.totalAmount, 399.99);
  } finally {
    await harness.close();
  }
});

test('rejects invalid submissions', async () => {
  const harness = await createTestServer();

  try {
    const response = await fetch(`${harness.baseUrl}/api/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeName: '',
        employeeEmail: 'invalid-email',
        department: '',
        category: 'Invalid',
        expenseDate: 'not-a-date',
        amount: -4,
        description: 'short'
      })
    });

    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.ok(payload.errors.length >= 6);
  } finally {
    await harness.close();
  }
});
