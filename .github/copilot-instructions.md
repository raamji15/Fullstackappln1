# Copilot Instructions

- This repository contains a lightweight employee reimbursement system working model built with Express and a static frontend.
- Keep the backend API in `src/` and the browser UI in `public/`.
- Store sample and local runtime reimbursement data in `data/claims.json` unless tests provide an alternate file.
- Prefer small, dependency-light changes that preserve the current REST endpoints and dashboard workflow.
- Validate reimbursement inputs on the server before persisting them.
