<!-- SYNC IMPACT REPORT
Version Change: CREATED → 1.0.0
New Document: First Constitution for React Pages library
Principles Added (5):
  1. Component Library First - all code serves reusable, standalone components
  2. TypeScript Strict Mode - mandatory type safety throughout
  3. Test Coverage & Reliability - comprehensive testing strategy per component
  4. Performance & Bundle Optimization - build-time and runtime performance standards
  5. Breaking Change Management - semantic versioning and migration paths

Sections Added:
  - Core Principles (5 principles)
  - Build & Publishing Standards
  - Quality Gates
  - Governance

Templates Updated: All dependent templates align with React/Rollup specifics
  ✅ spec-template.md: Adjusted for component-level requirements
  ✅ plan-template.md: React + TypeScript context
  ✅ tasks-template.md: Build, test, and publish workflows
-->

# React Pages Library Constitution

A comprehensive governance document for maintaining code quality in the `@gaddario98/react-pages` component library, built with React 19+ and Rollup.

## Core Principles

### I. Component Library First

**Every feature is a reusable, independently consumable component.**

- All code MUST be exportable as a standalone module via defined package exports
- Components MUST have zero implicit dependencies on application-level state or configuration
- Each component MUST declare its prop interface explicitly with TypeScript (no `any` types)
- Documentation MUST be generated from TypeScript types and JSDoc comments
- Examples MUST compile and run independently of the application consuming them

**Rationale**: This library serves multiple projects and teams. Components must be self-contained and predictable to enable confident integration across diverse use cases.

---

### II. TypeScript Strict Mode (NON-NEGOTIABLE)

**All code MUST compile with strict TypeScript settings; type safety is non-negotiable.**

- `"strict": true` MUST be enforced in `tsconfig.json`
- `"noImplicitAny": true` – all function parameters and return types explicitly typed
- `"noUncheckedIndexedAccess": true` – array/object access validated
- `"strictNullChecks": true` – null/undefined handling mandatory
- `"noUnusedLocals": true` and `"noUnusedParameters": true` – no dead code
- Any violation of strict mode MUST be documented in a comment with justification and approval (cannot merge without both)
- Type assertions (`as`) only allowed in boundary layers; inline assertions forbidden in component logic

**Rationale**: Type safety catches integration errors early and serves as executable documentation for consumers. Strict mode is table stakes for a library expected to work across multiple projects.

---

### III. Test Coverage & Reliability (NON-NEGOTIABLE)

**Every component and utility export MUST have corresponding test coverage.**

**Acceptance Criteria for Merge**:
- Minimum 80% line coverage for new/modified code
- 100% coverage of exported public APIs
- All user-facing interactions tested (click, form submission, async state changes)
- Edge cases and error states tested (null inputs, network failures, boundary values)
- Test framework: `vitest` with `@testing-library/react` for components

**Test Structure**:
- `*.test.ts(x)` files colocated with source files
- Unit tests: Individual component props, hooks, utilities
- Integration tests: Multi-component workflows (form + query + display)
- Snapshot tests: ONLY for stable UI patterns; not for brittle DOM snapshots

**Rationale**: A library's reliability is measured by consumer confidence. Missing tests become technical debt; high coverage catches regressions before release.

---

### IV. Performance & Bundle Optimization

**Build output MUST be optimized for size and tree-shaking; runtime performance critical.**

**Build Standards**:
- Rollup MUST generate dual outputs: CommonJS (`.js`) + ES Modules (`.mjs`)
- Tree-shaking MUST work: all re-exports tested with `sideEffects: false`
- Type definitions (`.d.ts`) MUST be bundled and valid for TypeScript consumers
- No dynamic requires or vendor lock-in patterns (e.g., `require(userInput)`)
- Unused dependencies removed from final bundle (Rollup plugins verify)

**Bundle Size Goals**:
- **Main bundle** (`dist/index.mjs`): < 50 KB gzipped
- **Per-export bundle** (`dist/[feature]/index.mjs`): < 20 KB gzipped
- Monitor using `rollup-plugin-filesize` or equivalent

**Runtime Performance**:
- Components MUST memoize expensive renders with `React.memo()` or `useMemo()`
- Hooks MUST not cause cascade re-renders; `useCallback()` required for event handlers
- Query integration MUST use TanStack Query caching (no redundant fetches)
- Build warnings treated as failures in CI: zero warnings policy

**Rationale**: Library consumers optimize their bundles against our exports. Poor bundle hygiene cascades as bloat; performance bottlenecks in our code become bottlenecks in production applications.

---

### V. Breaking Change Management

**All changes MUST follow semantic versioning (semver); breaking changes require migration planning.**

**Version Bumping Rules** (automated in CI):
- **PATCH** (1.0.1): Bug fixes, internal refactors, documentation. No API changes.
- **MINOR** (1.1.0): New features, new exports, non-breaking enhancements. Existing code unaffected.
- **MAJOR** (2.0.0): Prop changes, removed exports, dependency bumps (React 18→19), signature changes.

**Breaking Change Checklist** (required for MAJOR version):
- [ ] Changelog entry with migration guide (before/after code examples)
- [ ] Deprecated APIs kept for 1 minor version with console warnings
- [ ] Consumer projects can upgrade incrementally (no forced breaking in patch/minor)
- [ ] Update dependent libraries (auth, form, queries) in lock-step if interdependent
- [ ] Draft PR description includes migration path for all consumers

**Rationale**: Semver enables predictable upgrades; clear deprecation paths reduce friction for downstream teams. Breaking changes without migration guidance break trust.

---

## Build & Publishing Standards

**Publishing Workflow**:

1. **Pre-publish**: `npm run build` MUST succeed with zero warnings
2. **Version**: Update `package.json` version per semver rules
3. **Publish**: GitHub Actions publishes to NPM and GitHub Package Registry (`.github/workflows/publish.yml`)
4. **Verification**: TypeScript definitions and both CommonJS/ESM exports verified post-publish

**Bundle Entry Points** (must match `package.json` exports):

```json
{
  ".": "dist/index.js|mjs",
  "./components": "dist/components/index.js|mjs",
  "./hooks": "dist/hooks/index.js|mjs",
  "./config": "dist/config/index.js|mjs",
  "./utils": "dist/utils/index.js|mjs"
}
```

Each entry point MUST:
- Export only public APIs (no `_private` functions)
- Include type definitions (`.d.ts`)
- Be independently tree-shakeable

---

## Quality Gates

**All pull requests MUST pass**:

1. **Build Gate**: `npm run build` succeeds, zero Rollup warnings
2. **Type Gate**: `tsc --noEmit` passes (strict TypeScript check)
3. **Test Gate**: Coverage >= 80% for new code; all tests pass
4. **Lint Gate**: No ESLint violations (if configured)
5. **Package Audit**: `npm audit` passes (no critical vulnerabilities)
6. **Bundle Size Gate**: Gzipped bundle size doesn't increase by >5% without justification
7. **Peer Dependency Gate**: All declared peer dependencies (React, React DOM) must be installable

**Pre-commit Hooks** (recommended):

```bash
yarn husky install && yarn husky add .husky/pre-commit \
  "yarn tsc --noEmit && yarn test"
```

---

## Governance

**Constitution Supersedes All Other Practices**

This constitution is the authoritative source for quality standards in this library. Any conflicting guidance in READMEs, ADRs, or comments is subordinate to this document.

**Amendment Procedure**

1. **Proposal**: Open an issue or discussion with rationale (e.g., "React 20 support requires async components")
2. **Review**: Minimum 1 maintainer approval required
3. **Documentation**: Amendment approved with version bump (MINOR if principle refinement, MAJOR if new constraint)
4. **Propagation**: Update affected templates in `.specify/templates/` and notify dependent projects
5. **Implementation**: PRs merged after amendment are held to new standard immediately

**Compliance Review**

- Code reviews MUST verify compliance with principles before merge
- Violations require explicit justification and approval (minimum 2 reviewers for principle waivers)
- Quarterly audits of bundle size, coverage metrics, and TypeScript strictness
- Breaking changes tracked in `CHANGELOG.md` per Keep a Changelog format

**Use Runtime Guidance**

For day-to-day development, refer to:
- [README.md](../../README.md) – API reference and examples
- [package.json](../../package.json) – Dependency and export configuration
- [rollup.config.js](../../rollup.config.js) – Build process and output format
- [tsconfig.json](../../tsconfig.json) – TypeScript compiler settings

---

**Version**: 1.0.0 | **Ratified**: 2025-10-29 | **Last Amended**: 2025-10-29
