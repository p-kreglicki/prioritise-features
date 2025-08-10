## Relevant Files

- `web/package.json` - Project dependencies and scripts for Next.js, TypeScript, Jest, and ESLint/Prettier.
- `web/next.config.js` - Next.js configuration.
- `web/tsconfig.json` - TypeScript configuration.
- `web/jest.config.ts` - Jest configuration for TS + React.
- `web/jest.setup.ts` - Jest setup for Testing Library.
- `web/app/layout.tsx` - Root layout.
- `web/app/page.tsx` - Main page hosting the RICE table UI.
- `web/components/RiceTable.tsx` - Table UI with add/edit/delete, sorting, and tooltips.
- `web/components/ImportDialog.tsx` - Modal/dialog to preview and validate CSV/JSON imports.
- `web/components/ExportMenu.tsx` - Export controls (CSV/JSON, copy-to-clipboard).
- `web/lib/rice.ts` - RICE types, T-shirt/impact/confidence mappings, score calculation, and sort helpers.
- `web/lib/csv.ts` - CSV/JSON parsing and serialization utilities.
- `web/lib/storage.ts` - Local storage persistence helpers (save/load schema, versioning).
- `web/styles/globals.css` - Base styles.
- `web/lib/rice.test.ts` - Unit tests for scoring and sorting logic.
- `web/lib/csv.test.ts` - Unit tests for import/export mapping and validation.
- `web/components/RiceTable.test.tsx` - Component tests for CRUD and live recalculation.

### Notes

- Unit tests should be placed alongside the files they test (e.g., `lib/rice.ts` and `lib/rice.test.ts`).
- Use `npx jest [optional/path/to/test/file]` to run tests.
- Prefer TypeScript with strict typing for calculation correctness and scale mappings.

## Tasks

- [x] 1.0 Project scaffold and tooling
  - [x] 1.1 Initialize Next.js (App Router) with TypeScript: create `package.json`, `next.config.js`, `tsconfig.json`.
  - [x] 1.2 Configure ESLint + Prettier: add configs and `lint`/`format` scripts.
  - [x] 1.3 Set up Jest + Testing Library: `jest.config.ts`, `setupTests.ts`, add `test` script.
  - [x] 1.4 Create base folders: `app/`, `components/`, `lib/`, `styles/` and `styles/globals.css`.
  - [x] 1.5 Add `app/layout.tsx` with basic HTML structure and global styles.
  - [x] 1.6 Add `app/page.tsx` placeholder with link to PRD and TODOs.
  - [x] 1.7 Verify `npm run dev` starts and renders the placeholder page.

- [x] 2.0 RICE domain logic
  - [x] 2.1 Define types in `lib/rice.ts`: `Feature`, `RiceScales`, and `PersistedState`.
  - [x] 2.2 Implement constants: Impact, Confidence, Effort (XS:0.5, S:1, M:2, L:4, XL:8).
  - [x] 2.3 Implement `computeRiceScore(feature)` using (Reach × Impact × Confidence) / Effort.
  - [x] 2.4 Implement `compareByRice(a,b)` with tie-breakers: lowest Effort, then highest Impact.
  - [x] 2.5 Implement validation helpers: non-negative reach, allowed enums, effort != 0.
  - [x] 2.6 Unit tests in `lib/rice.test.ts` covering typical, boundary, and invalid cases.

- [ ] 3.0 Table UI
  - [x] 3.1 Build base layout in `app/page.tsx` with heading and `RiceTable` mount.
  - [x] 3.2 Implement `components/RiceTable.tsx` columns: Feature, Reach/quarter, Impact, Confidence, Effort, Score, Actions.
  - [x] 3.5 Add tooltips/explanations for R/I/C/E; include scale legends.
  - [x] 3.3 Implement add row, inline edit (controlled inputs), and delete with confirm.
  - [x] 3.4 Recalculate scores on change and auto-sort using `compareByRice`.
  - [ ] 3.5 Add tooltips/explanations for R/I/C/E; include scale legends.
  - [x] 3.6 Inline validation messages and disable score display for incomplete rows.
  - [x] 3.7 Keyboard navigation and accessibility (labels, roles, focus order).
  - [ ] 3.8 Component tests `components/RiceTable.test.tsx` for CRUD and live updates.

- [ ] 4.0 Import/Export
  - [x] 4.1 Implement `lib/csv.ts` to parse CSV → features and stringify features → CSV; support JSON import/export.
  - [x] 4.2 Implement label mapping (case-insensitive) for impact, confidence, effort; validate and report errors.
  - [x] 4.3 Build `components/ImportDialog.tsx` for upload, preview, and apply (replace or append) with validation summary.
  - [x] 4.4 Build `components/ExportMenu.tsx` for CSV/JSON download and copy-to-clipboard table.
  - [x] 4.5 Unit tests `lib/csv.test.ts` for parsing, mapping, and error handling.

- [x] 5.0 Persistence
  - [x] 5.1 Implement `lib/storage.ts` with autosave to `localStorage` and schema versioning.
  - [x] 5.2 Restore state on load; handle incompatible versions (show reset option).
  - [x] 5.3 Debounce saves to avoid excessive writes; expose `saveState`/`loadState` helpers.
  - [x] 5.4 Add UI actions: Clear data and Import/Export entry points.
  - [x] 5.5 Tests for storage helpers (mock `localStorage`).

- [ ] 6.0 Accessibility, responsiveness, and performance polish
  - [ ] 6.1 Ensure responsive layout for small screens; verify horizontal scroll/stacking strategy.
  - [ ] 6.2 Verify ARIA roles, labels, focus management, and tab order for table interactions.
  - [ ] 6.3 Optimize re-renders (memoization) and ensure updates remain instant for <20 rows.
  - [ ] 6.4 QA: verify sorting tie-breakers, rounding (display 2 decimals), and empty-state UX.
  - [ ] 6.5 Add README usage section and sample files `samples/features.csv` and `samples/features.json`.

I have generated the high-level tasks based on the PRD. Ready to generate the sub-tasks? Respond with "Go" to proceed.


