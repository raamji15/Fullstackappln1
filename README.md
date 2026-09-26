# Fullstackappln1

A working employee reimbursement system model with an Express backend, a static frontend dashboard, and file-based persistence.

## Features

- Submit reimbursement claims from the browser
- Review all submitted claims in a dashboard
- Filter claims by status
- Approve or reject pending claims
- View live summary metrics for claim volume and amount
- Persist claim data locally in `data/claims.json`

## Tech Stack

- Node.js
- Express
- Vanilla HTML, CSS, and JavaScript

## Getting Started

### Install dependencies

```bash
npm install
```

### Run the application

```bash
npm start
```

Then open `http://localhost:3000`.

## Run tests

```bash
npm test
```

## API Endpoints

- `GET /api/health` - service health check
- `GET /api/claims` - list all claims
- `GET /api/claims?status=pending` - filter claims by status
- `POST /api/claims` - create a new claim
- `PATCH /api/claims/:id/status` - update claim status
- `GET /api/summary` - dashboard summary totals
