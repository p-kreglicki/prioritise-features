# PRD: RICE Prioritization App

## 1. Introduction/Overview

A lightweight web app for a solo founder to quickly prioritize a small set of features using the RICE framework. Users manually enter features, see computed RICE scores, and get an auto-sorted list to decide what to build first.

## 2. Goals

- Compute RICE score = (Reach × Impact × Confidence) / Effort.
- Manual entry for <20 features with add/edit/delete and auto-sort.
- Clear tooltips explaining R, I, C, E.
- Import and export results as CSV and JSON.
- Persist session data locally so users don’t lose progress.
- Sorting tie-breakers: lowest Effort, then highest Impact.

## 3. User Stories

- As a founder, I can add features with R/I/C/E values so I can see their RICE scores and ranking.
- As a founder, I can edit any value and see the score update immediately so decisions are fast.
- As a founder, I can export my list as CSV or JSON to share or archive it.
- As a founder, I can import a CSV or JSON to continue work or compare alternatives.
- As a founder, my list is saved locally between sessions so I don’t lose progress.

## 4. Functional Requirements

1. Data Model
   - Feature fields: `id`, `name` (required), `description` (optional), `reach` (number, customers per quarter), `impact` (enum), `confidence` (enum), `effort` (T‑shirt enum), `score` (derived), `createdAt`, `updatedAt`.
2. Formula and Scales
   - Score = (Reach × Impact × Confidence) / EffortNumeric.
   - Reach: number (customers per quarter).
   - Impact (enum → numeric): { Massive: 3, High: 2, Medium: 1, Low: 0.5, Minimal: 0.25 }.
   - Confidence (enum → numeric): { 100%: 1.0, 80%: 0.8, 50%: 0.5 }.
   - Effort (T‑shirt → numeric): { XS: 0.5, S: 1, M: 2, L: 4, XL: 8 }.
   - Prevent division by zero: Effort cannot be 0.
   - Rounding: display score to 2 decimal places; calculate with full precision.
3. Table UI
   - Columns: Feature, Reach (per quarter), Impact, Confidence, Effort, Score, Actions.
   - Auto-sort by Score desc; tie-break by lowest EffortNumeric, then highest Impact.
   - Inline tooltips explaining each field and scale.
   - Inline validation and warnings for missing/invalid values.
4. CRUD
   - Add new feature row; edit in-place; delete row with confirm.
5. Import
   - CSV and JSON import.
   - CSV expected headers: `name`, `reach`, `impact`, `confidence`, `effort`, `description` (optional).
   - Impact/confidence/effort accept human labels or numeric equivalents; map case-insensitively.
   - Show preview and validation before applying.
6. Export
   - Export current list as CSV or JSON; include computed `score`.
7. Persistence
   - Autosave current list to local browser storage; restore on next visit.
   - Manual import/export remains available as the primary file-based save/share.
8. Validation & Edge Cases
   - Allow missing optional fields but warn if any of R/I/C/E missing; incomplete rows excluded from score and ranking until completed.
   - Disallow Effort = 0.
   - Bounds: Reach ≥ 0; Impact/Confidence must be from configured scales.
   - Duplicate names allowed but flagged as a soft warning.
9. Accessibility & Responsiveness
   - Keyboard navigable table editing; basic responsive layout for small screens.
10. Performance
   - Instant updates for up to 20 features.

## 5. Non-Goals (Out of Scope)

- Jira/Linear or other integrations.
- Authentication.
- Complex role-based permissions.
- Custom formulas per project.

## 6. Design Considerations (Optional)

- Clean, minimal table-first UI; neutral theme.
- Badge/select components for Impact, Confidence, Effort.
- Visual emphasis on top-ranked items (e.g., subtle highlight for top 3).

## 7. Technical Considerations (Optional)

- Platform: Web app built with React/Next.js (TypeScript recommended).
- State: React state with a simple reducer; persist via `localStorage`.
- CSV parsing: lightweight library (e.g., Papa Parse) or native parsing if minimal.
- No backend required for v1.
- Testing scope: basic calculation unit tests and import/export mapping tests.

## 8. Success Metrics

- User can add/edit/delete features and see correct scores and ranking.
- Import and export (CSV/JSON) complete without errors on valid files.
- Data persists locally across reloads.
- Calculation accuracy verified on sample cases; no division-by-zero or NaN scores.

## 9. Open Questions

- CSV header naming OK? `name, reach, impact, confidence, effort, description`
- Any preference for decimal precision on displayed score (2 vs 1)?
- Should we allow custom labels/timebox text for Reach per project, or keep fixed at “customers per quarter” for v1?


