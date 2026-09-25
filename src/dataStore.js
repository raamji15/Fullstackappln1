const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const defaultDataFile = path.join(__dirname, '..', 'data', 'claims.json');

async function ensureStore(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify({ claims: [] }, null, 2));
  }
}

async function readClaims(filePath = defaultDataFile) {
  await ensureStore(filePath);
  const fileContents = await fs.readFile(filePath, 'utf8');
  const parsed = JSON.parse(fileContents || '{"claims":[]}');
  return Array.isArray(parsed.claims) ? parsed.claims : [];
}

async function writeClaims(claims, filePath = defaultDataFile) {
  await ensureStore(filePath);
  await fs.writeFile(filePath, JSON.stringify({ claims }, null, 2));
}

function buildSummary(claims) {
  return claims.reduce(
    (summary, claim) => {
      summary.totalClaims += 1;
      summary.totalAmount += claim.amount;
      summary.statusCounts[claim.status] += 1;
      return summary;
    },
    {
      totalClaims: 0,
      totalAmount: 0,
      statusCounts: { pending: 0, approved: 0, rejected: 0 }
    }
  );
}

async function listClaims({ status, filePath } = {}) {
  const claims = await readClaims(filePath);
  const normalizedStatus = status ? status.toLowerCase() : null;
  const filteredClaims = normalizedStatus
    ? claims.filter((claim) => claim.status === normalizedStatus)
    : claims;

  return filteredClaims.sort((left, right) => new Date(right.submittedAt) - new Date(left.submittedAt));
}

async function createClaim(input, filePath = defaultDataFile) {
  const claims = await readClaims(filePath);
  const claim = {
    id: crypto.randomUUID(),
    employeeName: input.employeeName,
    employeeEmail: input.employeeEmail,
    department: input.department,
    category: input.category,
    expenseDate: input.expenseDate,
    amount: input.amount,
    description: input.description,
    status: 'pending',
    submittedAt: new Date().toISOString(),
    reviewedAt: null
  };

  claims.push(claim);
  await writeClaims(claims, filePath);
  return claim;
}

async function updateClaimStatus(id, status, filePath = defaultDataFile) {
  const claims = await readClaims(filePath);
  const claimIndex = claims.findIndex((claim) => claim.id === id);

  if (claimIndex === -1) {
    return null;
  }

  claims[claimIndex] = {
    ...claims[claimIndex],
    status,
    reviewedAt: new Date().toISOString()
  };

  await writeClaims(claims, filePath);
  return claims[claimIndex];
}

async function getSummary(filePath = defaultDataFile) {
  const claims = await readClaims(filePath);
  return buildSummary(claims);
}

module.exports = {
  defaultDataFile,
  listClaims,
  createClaim,
  updateClaimStatus,
  getSummary,
  readClaims,
  writeClaims
};
