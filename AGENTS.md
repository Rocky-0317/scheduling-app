# Codex Workload Guidelines

- Prefer targeted searches, for example `rg "keyword" src`, instead of scanning the whole repository.
- Exclude heavy/generated directories from reads and searches: `node_modules`, `dist`, `docs/base/assets`, `docs/gif/assets`, `.git`, `.idea`, `.vscode`, and `.cursor`.
- Do not run long-lived dev servers unless the task requires browser verification.
- When a dev server is needed, prefer `pnpm dev:h5:codex` so external devtools are not opened automatically.
- Prefer checking or linting changed files only. Avoid full `pnpm lint`, `pnpm type-check`, or full builds unless the change needs that level of verification.
