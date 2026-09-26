const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});

const claimsList = document.getElementById('claimsList');
const claimForm = document.getElementById('claimForm');
const formMessage = document.getElementById('formMessage');
const statusFilter = document.getElementById('statusFilter');
const refreshButton = document.getElementById('refreshButton');

function setSummary(summary) {
  document.getElementById('totalClaims').textContent = String(summary.totalClaims);
  document.getElementById('totalAmount').textContent = currencyFormatter.format(summary.totalAmount);
  document.getElementById('pendingClaims').textContent = String(summary.statusCounts.pending);
  document.getElementById('approvedClaims').textContent = String(summary.statusCounts.approved);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function renderClaims(claims) {
  if (claims.length === 0) {
    claimsList.innerHTML = '<p class="empty-state">No claims match the selected filter.</p>';
    return;
  }

  claimsList.innerHTML = claims
    .map(
      (claim) => `
        <article class="claim-card">
          <div class="claim-topline">
            <div>
              <h3>${claim.employeeName}</h3>
              <p>${claim.department} • ${claim.employeeEmail}</p>
            </div>
            <div>
              <strong>${currencyFormatter.format(claim.amount)}</strong>
              <span class="badge ${claim.status}">${claim.status}</span>
            </div>
          </div>
          <div class="claim-meta">
            <span><strong>Category:</strong> ${claim.category}</span>
            <span><strong>Expense date:</strong> ${formatDate(claim.expenseDate)}</span>
            <span><strong>Submitted:</strong> ${formatDate(claim.submittedAt)}</span>
          </div>
          <p class="claim-description">${claim.description}</p>
          ${
            claim.status === 'pending'
              ? `<div class="claim-actions">
                  <button class="action-button approve" data-id="${claim.id}" data-status="approved">Approve</button>
                  <button class="action-button reject" data-id="${claim.id}" data-status="rejected">Reject</button>
                </div>`
              : ''
          }
        </article>
      `
    )
    .join('');
}

async function loadDashboard() {
  const status = statusFilter.value;
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const [claimsResponse, summaryResponse] = await Promise.all([
    fetch(`/api/claims${query}`),
    fetch('/api/summary')
  ]);

  const claimsData = await claimsResponse.json();
  const summaryData = await summaryResponse.json();

  renderClaims(claimsData.claims || []);
  setSummary(summaryData);
}

async function submitClaim(event) {
  event.preventDefault();
  formMessage.textContent = '';

  const formData = new FormData(claimForm);
  const payload = Object.fromEntries(formData.entries());

  const response = await fetch('/api/claims', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    formMessage.textContent = data.errors?.join(' ') || 'Unable to submit claim.';
    formMessage.style.color = '#b91c1c';
    return;
  }

  claimForm.reset();
  formMessage.textContent = 'Claim submitted successfully.';
  formMessage.style.color = '#0f766e';
  await loadDashboard();
}

async function handleClaimAction(event) {
  const button = event.target.closest('[data-id][data-status]');

  if (!button) {
    return;
  }

  button.disabled = true;

  const response = await fetch(`/api/claims/${button.dataset.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: button.dataset.status })
  });

  button.disabled = false;

  if (!response.ok) {
    window.alert('Unable to update claim status.');
    return;
  }

  await loadDashboard();
}

claimForm.addEventListener('submit', submitClaim);
statusFilter.addEventListener('change', loadDashboard);
refreshButton.addEventListener('click', loadDashboard);
claimsList.addEventListener('click', handleClaimAction);

loadDashboard().catch(() => {
  claimsList.innerHTML = '<p class="empty-state">Unable to load the reimbursement dashboard.</p>';
});
