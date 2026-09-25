const validStatuses = new Set(['pending', 'approved', 'rejected']);
const validCategories = new Set(['Travel', 'Meals', 'Supplies', 'Training', 'Other']);

function normalizeClaimInput(body = {}) {
  return {
    employeeName: String(body.employeeName || '').trim(),
    employeeEmail: String(body.employeeEmail || '').trim(),
    department: String(body.department || '').trim(),
    category: String(body.category || '').trim(),
    expenseDate: String(body.expenseDate || '').trim(),
    amount: Number(body.amount),
    description: String(body.description || '').trim()
  };
}

function validateClaimInput(input) {
  const errors = [];

  if (!input.employeeName) {
    errors.push('Employee name is required.');
  }

  if (!input.employeeEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.employeeEmail)) {
    errors.push('A valid employee email is required.');
  }

  if (!input.department) {
    errors.push('Department is required.');
  }

  if (!validCategories.has(input.category)) {
    errors.push('Category must be one of Travel, Meals, Supplies, Training, or Other.');
  }

  if (!input.expenseDate || Number.isNaN(Date.parse(input.expenseDate))) {
    errors.push('A valid expense date is required.');
  }

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    errors.push('Amount must be a number greater than zero.');
  }

  if (!input.description || input.description.length < 10) {
    errors.push('Description must be at least 10 characters long.');
  }

  return errors;
}

function validateStatus(status) {
  if (!validStatuses.has(status)) {
    return ['Status must be pending, approved, or rejected.'];
  }

  return [];
}

module.exports = {
  normalizeClaimInput,
  validateClaimInput,
  validateStatus,
  validCategories,
  validStatuses
};
