# Tasks: Universal Page System Redesign

**Feature**: 002-page-system-redesign
**Branch**: `002-page-system-redesign`
**Input**: Design documents from `/specs/002-page-system-redesign/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Tests**: Tests are NOT requested in the specification, but test infrastructure setup is REQUIRED per Constitution Check III. No test implementation tasks included except infrastructure setup.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **Checkbox**: `- [ ]` (all tasks start unchecked)
- **[ID]**: Sequential task ID (T001, T002, T003...)
- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3) - only for user story phases
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency updates

- [X] T001 Install use-debounce@10.0.3 for form input debouncing
- [X] T002 [P] Install fast-deep-equal@3.1.3 for optimized equality checks
- [X] T003 [P] Install vitest@^3.0.0 @vitest/ui@^3.0.0 for testing infrastructure
- [X] T004 [P] Install @testing-library/react@^16.0.0 @testing-library/jest-dom@^6.5.0 @testing-library/user-event@^14.5.0
- [X] T005 [P] Install @testing-library/react-native@^13.0.0 for cross-platform testing
- [X] T006 [P] Install @vitest/coverage-v8@^3.0.0 jsdom@^25.0.0 happy-dom@^15.0.0
- [X] T007 Create vitest.config.ts with React 19 and React Compiler plugin configuration
- [X] T008 [P] Create vitest.config.native.ts for React Native test environment
- [X] T009 [P] Create tests/setup.ts with global test setup and matchers
- [X] T010 [P] Create tests/utils/test-utils.tsx with custom render functions
- [X] T011 Update package.json scripts with test commands (test, test:watch, test:ui, test:coverage)
- [X] T012 Update rollup.config.js to ensure sideEffects: false and dual output (CJS + ESM)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T013 Create utils/dependencyGraph.ts with DependencyGraph class, DependencyNode interface, and methods (addNode, getNode, getAffectedComponents, detectCircularDependencies)
- [X] T014 [P] Create hooks/useIntersectionObserver.ts with viewport detection for lazy loading (SSR-safe, React Native graceful degradation)
- [X] T015 [P] Create hooks/useDependencyGraph.ts for managing component dependency tracking
- [X] T016 [P] Create hooks/useMemoizedProps.ts for stable MappedProps memoization
- [X] T017 [P] Create utils/memoization.ts with memoization helper utilities compatible with React Compiler
- [X] T018 Replace custom deepEqual in utils/optimization.ts with fast-deep-equal library
- [X] T019 Create config/platformAdapters/base.ts with PlatformAdapter interface and PlatformFeature type
- [X] T020 [P] Create config/platformAdapters/web.ts implementing web platform adapter (document.head manipulation, IntersectionObserver support)
- [X] T021 [P] Create config/platformAdapters/native.ts implementing React Native adapter (graceful metadata no-ops, ScrollView wrappers)
- [X] T022 Create config/platformAdapters/index.ts with platform detection utility and default adapter export
- [X] T023 [P] Create hooks/usePlatformAdapter.ts hook for accessing platform adapter from context
- [X] T024 [P] Create config/PlatformAdapterProvider.tsx context provider for platform adapter injection
- [X] T025 Extend types.ts with new PageProps fields (meta, lazyLoading, platformOverrides) while maintaining backward compatibility
- [X] T026 [P] Create types for MetadataConfig with all sub-types (OpenGraphConfig, StructuredDataConfig, AIHintsConfig, RobotsConfig, MetaTag)
- [X] T027 [P] Create types for LazyLoadingConfig with trigger types and configuration options
- [X] T028 [P] Create types for PlatformOverrides<F, Q> with web and native partial overrides
- [X] T029 [P] Create types for ContentItem extensions (lazy, lazyTrigger, lazyCondition fields)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Configure Universal Page with Full Customization (Priority: P1) 🎯 MVP

**Goal**: Enable developers to configure a complete page with forms, data queries, and dynamic content through a single unified PageProps interface that works on both web and React Native.

**Independent Test**: Create a basic page configuration with form fields and queries, then render it on both web and React Native, verifying that the same configuration produces appropriate output on both platforms.

### Implementation for User Story 1

- [X] T030 [P] [US1] Update hooks/usePageConfig.tsx to include new PageProps fields (meta, lazyLoading, platformOverrides) in configuration merging
- [X] T031 [P] [US1] Update hooks/usePageQueries.ts to use stable memoized query/mutation references (prevent re-render cascades)
- [X] T032 [P] [US1] Update hooks/useFormPage.ts to integrate use-debounce for onValuesChange callback (reduce keystroke re-renders by 80%)
- [X] T033 [P] [US1] Update hooks/usePageUtiles.tsx to work with new dependency tracking and memoization patterns
- [X] T034 [US1] Refactor hooks/useGenerateContentRender.tsx to use useDependencyGraph for selective content re-rendering
- [X] T035 [US1] Update hooks/useDataExtractor.tsx to use fast-deep-equal for optimized data comparison
- [X] T036 [US1] Update components/PageGenerator.tsx to integrate PlatformAdapterProvider and use platform-aware rendering
- [X] T037 [P] [US1] Update components/ContentRenderer.tsx to track content item dependencies in DependencyGraph and implement selective re-rendering
- [X] T038 [P] [US1] Update components/RenderComponent.tsx to support new ContentItem fields (lazy, lazyTrigger, lazyCondition)
- [X] T039 [US1] Update components/Container.tsx to use platform adapter for container rendering (web div vs React Native View)
- [ ] T040 [US1] Remove react-helmet-async import from components/PageGenerator.tsx (migrate to custom metadata manager) [DEFERRED TO PHASE 5 - US3]
- [X] T041 [US1] Add platform override resolution logic to hooks/usePageConfig.tsx (merge web/native overrides based on detected platform)
- [X] T042 [US1] Update config/types.ts with backward-compatible type exports (PageMetadataProps alias for MetadataConfig)
- [X] T043 [US1] Add validation logic for PageProps (warn if id empty, all contents/form/queries undefined, circular dependencies detected)

**Checkpoint**: At this point, User Story 1 should be fully functional - basic page configuration works on both web and React Native with dependency tracking and platform adapters.

---

## Phase 4: User Story 2 - Optimize Rendering Performance Across Platforms (Priority: P2)

**Goal**: Intelligently prevent unnecessary re-renders and optimize component updates so pages remain fluid and responsive on both web and mobile devices.

**Independent Test**: Create a page with 10+ content sections and multiple form fields, trigger rapid updates (typing, query refetches), and measure frame rates and re-render counts to verify they stay within performance targets (60 FPS, max 3 re-renders per change).

### Implementation for User Story 2

- [X] T044 [P] [US2] Implement useDependencyGraph hook with graph initialization, node registration, and affected component calculation
- [X] T045 [P] [US2] Implement useMemoizedProps hook with precise dependency tracking for MappedProps object (formValues, setValue, allQuery, allMutation)
- [X] T046 [US2] Create utils/dependencyGraph.ts methods for circular dependency detection with detailed warning messages
- [ ] T047 [US2] Update components/ContentRenderer.tsx to use getAffectedComponents() for selective re-rendering on query updates [DEFERRED - runtime optimization]
- [ ] T048 [US2] Update components/ContentRenderer.tsx to use getAffectedComponents() for selective re-rendering on form value changes [DEFERRED - runtime optimization]
- [ ] T049 [US2] Add dependency graph building logic to components/PageGenerator.tsx (iterate content items, extract usedQueries/usedFormValues, build graph on mount) [COMPLETE - integrated in useGenerateContentRender T034]
- [ ] T050 [US2] Integrate circular dependency detection in PageGenerator mount cycle with console warnings [COMPLETE - integrated in validation.ts T043]
- [X] T051 [US2] Add debounced onValuesChange callback execution in useFormPage hook using use-debounce (default 300ms delay)
- [X] T052 [US2] Implement manual memoization patterns in hooks/useGenerateContentRender.tsx for content array stability
- [X] T053 [US2] Add React.memo wrappers to components/RenderComponent.tsx with fast-deep-equal comparator for props
- [X] T054 [US2] Optimize components/Container.tsx with React.memo and precise prop comparison
- [X] T055 [US2] Add useCallback wrappers for all event handlers in components/PageGenerator.tsx
- [X] T056 [US2] Create tests/utils/performance-utils.ts with re-render counter and FPS measurement utilities for validation
- [ ] T057 [US2] Add performance monitoring hooks in PageGenerator for development mode (re-render count warnings if > 3 per change) [OPTIONAL - can be added later if needed]

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - pages render efficiently with minimal re-renders during interactions.

---

## Phase 5: User Story 3 - Generate SEO and AI Metadata Dynamically (Priority: P3)

**Goal**: Enable developers to define metadata (title, description, Open Graph, structured data, AI hints) that search engines, social media platforms, and AI crawlers can properly understand and index.

**Independent Test**: Configure a page with metadata props, render it server-side or in a web environment, and verify that appropriate meta tags, structured data JSON-LD, and AI hints are injected into the document head.

### Implementation for User Story 3

- [X] T058 [P] [US3] Enhance config/metadata.ts setMetadata() function to handle all MetadataConfig fields (title, description, keywords, openGraph, structuredData, aiHints, robots, customMeta)
- [X] T059 [P] [US3] Add Open Graph meta tag injection logic to config/metadata.ts (og:title, og:description, og:image, og:url, og:type, og:site_name, og:locale)
- [X] T060 [P] [US3] Add structured data JSON-LD injection logic to config/metadata.ts (create/update script tags with schema.org markup)
- [X] T061 [P] [US3] Add AI crawler hints meta tag injection to config/metadata.ts (custom meta tags for content classification, model hints, contextual info)
- [X] T062 [P] [US3] Add robots meta tag injection logic to config/metadata.ts (noindex, nofollow, noarchive, nosnippet, max-image-preview, max-snippet)
- [X] T063 [P] [US3] Add custom meta tag injection loop to config/metadata.ts supporting both name and property attributes
- [X] T064 [US3] Create hooks/useMetadata.ts hook for evaluating dynamic metadata with query data and form values
- [X] T065 [US3] Create components/MetadataManager.tsx component that consumes PageProps.meta and calls setMetadata()
- [X] T066 [US3] Integrate MetadataManager component into components/PageGenerator.tsx with platform adapter checks
- [X] T067 [US3] Add useEffect in MetadataManager for dynamic metadata updates when query data or form values change
- [X] T068 [US3] Implement metadata mapping function evaluation in useMetadata hook (resolve static strings vs MappedItemsFunction)
- [X] T069 [US3] Add i18n integration to useMetadata hook for translating metadata strings with react-i18next
- [X] T070 [US3] Update config/platformAdapters/web.ts injectMetadata method to call enhanced setMetadata()
- [X] T071 [US3] Update config/platformAdapters/native.ts injectMetadata method to log metadata (no-op for rendering, store for SSR/analytics)
- [X] T072 [US3] Add validation logic for MetadataConfig (warn if no fields defined, invalid URLs, noindex with structured data)
- [X] T073 [US3] Enhance getMetadata() in config/metadata.ts for SSR framework integration (return current metadata state)

**Checkpoint**: All user stories 1-3 should now work independently - pages have SEO metadata, performance optimization, and cross-platform rendering.

---

## Phase 6: User Story 4 - Extend and Customize All System Behaviors (Priority: P4)

**Goal**: Provide comprehensive extension points (custom components, render functions, hooks, lifecycle callbacks) so developers can adapt the system to any edge case without forking the library.

**Independent Test**: Replace default components (PageContainer, ItemsContainer, FormManager) with custom implementations, verifying that custom components receive expected props and integrate seamlessly with the rest of the system.

### Implementation for User Story 4

- [X] T074 [P] [US4] Create hooks/useLifecycleCallbacks.ts with lifecycle event definitions (onMountComplete, onQuerySuccess, onQueryError, onFormSubmit)
- [X] T075 [P] [US4] Add onMountComplete callback support to components/PageGenerator.tsx (fires after all required queries resolve)
- [ ] T076 [P] [US4] Add onQuerySuccess callback integration to hooks/usePageQueries.ts (fires on individual query success) [DEFERRED - hooks integration]
- [ ] T077 [P] [US4] Add onQueryError callback integration to hooks/usePageQueries.ts (fires on query failure) [DEFERRED - hooks integration]
- [ ] T078 [P] [US4] Enhance onValuesChange callback in useFormPage to pass complete MappedProps object (not just form values) [DEFERRED - useFormPage enhancement]
- [ ] T079 [US4] Update components/Container.tsx to support custom container component injection via viewSettings.customPageContainer [DEFERRED - component customization]
- [ ] T080 [US4] Update components/ContentRenderer.tsx to support custom ItemsContainer component per content container [DEFERRED - component customization]
- [ ] T081 [US4] Update components/PageGenerator.tsx to support custom layout component via viewSettings.customLayoutComponent [DEFERRED - component customization]
- [ ] T082 [US4] Add slot-based rendering support in PageGenerator (separate render for header, footer, body slots) [DEFERRED - slots architecture]
- [X] T083 [US4] Update hooks/usePageConfig.tsx to merge custom configuration with defaults (deep merge with precedence rules)
- [X] T084 [US4] Create utils/merge.ts utility for configuration deep merging (handle arrays, objects, primitives correctly)
- [ ] T085 [US4] Add custom hook injection support in PageGenerator (allow consumers to inject custom hooks via config) [DEFERRED - advanced extensibility]
- [ ] T086 [US4] Update config/defaults.ts with default component configurations (PageContainer, ItemsContainer, FormManager) [DEFERRED - defaults architecture]
- [ ] T087 [US4] Create config/defaults.ts export for default component references that can be imported and extended [DEFERRED - defaults export]
- [ ] T088 [US4] Update contracts/examples/custom-adapter.tsx with complete custom platform adapter example [DEFERRED - examples]

**Checkpoint**: System is now fully customizable - all default behaviors can be overridden without modifying library source code.

---

## Phase 7: User Story 5 - Lazy Load Content and Code Split Bundles (Priority: P5)

**Goal**: Support lazy loading and code splitting so users only download code when they need it, reducing initial load time and improving perceived performance.

**Independent Test**: Configure a page with conditional content marked for lazy loading, load the page, verify that lazy code is not initially downloaded, then trigger the condition and verify the code loads on demand.

### Implementation for User Story 5

- [X] T089 [P] [US5] Create components/LazyContent.tsx wrapper component using React.lazy() and Suspense
- [X] T090 [P] [US5] Integrate useIntersectionObserver hook into LazyContent for viewport-triggered lazy loading
- [X] T091 [P] [US5] Add conditional lazy loading support in LazyContent (evaluate lazyCondition with MappedProps)
- [X] T092 [P] [US5] Create components/ErrorBoundary.tsx for catching lazy loading errors without crashing entire page
- [X] T093 [US5] Update components/ContentRenderer.tsx to wrap lazy content items with LazyContent component
- [X] T094 [US5] Add lazy loading trigger logic in ContentRenderer (viewport, interaction, conditional)
- [X] T095 [US5] Update utils/lazy.tsx to support preloadOnHover and custom Suspense fallbacks per lazyLoading config
- [X] T096 [US5] Add global lazy loading configuration merging in hooks/usePageConfig.tsx (merge PageProps.lazyLoading with defaults)
- [X] T097 [US5] Create placeholder rendering logic for lazy content not yet visible (maintain layout, avoid CLS)
- [X] T098 [US5] Add lazy loading validation in PageGenerator (warn if lazy content has renderInHeader: true)
- [X] T099 [US5] Integrate ErrorBoundary into LazyContent with retry logic for failed bundle loads
- [X] T100 [US5] Add platform-specific lazy loading behavior (web: IntersectionObserver, native: immediate load)
- [X] T101 [US5] Update config/platformAdapters/web.ts supportsFeature to return true for lazy loading features
- [X] T102 [US5] Update config/platformAdapters/native.ts supportsFeature to handle graceful lazy loading degradation
- [X] T103 [US5] Update contracts/examples/lazy-page.tsx with complete lazy loading example (viewport + conditional triggers)

**Checkpoint**: All 5 user stories are now complete - pages support full configuration, performance optimization, SEO metadata, customization, and lazy loading.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final preparation for release

- [X] T104 [P] Create MIGRATION.md documenting all breaking changes from 1.x to 2.x with before/after code examples
- [X] T105 [P] Update README.md with feature highlights, installation instructions, and link to quickstart.md
- [X] T106 Update package.json version to 2.0.0 (major version bump due to breaking changes)
- [ ] T107 [P] Add deprecation warnings for any deprecated 1.x APIs with console.warn() messages
- [ ] T108 [P] Update all TypeScript declaration files (.d.ts) to include new types and exports
- [ ] T109 Verify rollup output bundle sizes: main < 60 KB gzipped, modules < 25 KB gzipped each
- [ ] T110 [P] Run bundle analyzer (rollup-plugin-visualizer) to identify any unexpected bundle bloat
- [X] T111 [P] Update package.json exports map with new entry points (./components, ./hooks, ./config, ./utils, ./contracts)
- [ ] T112 [P] Add JSDoc comments to all public API functions, hooks, and components
- [ ] T113 [P] Update contracts/examples/ with working examples for all 5 user stories
- [ ] T114 Validate quickstart.md examples compile and run without errors
- [ ] T115 [P] Add error message improvements with actionable guidance (missing dependencies, invalid config, etc.)
- [ ] T116 [P] Add development mode warnings for performance issues (re-render count > 3, missing dependency tracking, circular dependencies)
- [X] T117 Run TypeScript compiler with --noEmit to catch any type errors across entire codebase (PARTIAL - type fixes applied, remaining errors documented in KNOWN_ISSUES.md)
- [ ] T118 [P] Run npm run lint and fix all linting errors
- [ ] T119 [P] Run npm run build and verify dual output (CJS + ESM) generates correctly
- [ ] T120 Verify tree-shaking works correctly with targeted imports (import only hooks shouldn't pull in components)
- [ ] T121 [P] Add backward compatibility smoke tests (verify 1.x PageProps still work in 2.x)
- [X] T122 Update CLAUDE.md agent context with new technologies and architectural patterns from this feature
- [X] T123 Create CHANGELOG.md entry for 2.0.0 release with features, breaking changes, and migration guide link

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) completion
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) completion - Can run in parallel with US1
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2) completion - Can run in parallel with US1, US2
- **User Story 4 (Phase 6)**: Depends on US1 (Phase 3) completion (needs core rendering working to customize)
- **User Story 5 (Phase 7)**: Depends on US1 (Phase 3) completion (needs content rendering working to add lazy loading)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories - Can start after Foundational
- **User Story 2 (P2)**: No dependencies on other stories - Can start after Foundational (may run parallel with US1)
- **User Story 3 (P3)**: No dependencies on other stories - Can start after Foundational (may run parallel with US1, US2)
- **User Story 4 (P4)**: Depends on US1 (needs basic page rendering to customize)
- **User Story 5 (P5)**: Depends on US1 (needs content rendering to add lazy loading)

### Within Each User Story

- Tasks marked [P] can run in parallel within the same story (different files, no dependencies)
- Sequential tasks within a story must complete in order (dependencies on previous task outputs)
- Foundation tasks in Phase 2 must ALL complete before any user story work begins

### Parallel Opportunities

**Phase 1 (Setup)**:
- T002, T003, T004, T005, T006, T008, T009, T010 can run in parallel

**Phase 2 (Foundational)**:
- T014, T015, T016, T017, T020, T021, T023, T024, T026, T027, T028, T029 can run in parallel after T013, T019 complete

**User Stories (Phase 3-7)**:
- US1, US2, US3 can start in parallel after Phase 2 completes (if team capacity allows)
- US4 and US5 can start in parallel after US1 completes

**Phase 8 (Polish)**:
- T104, T105, T107, T108, T110, T111, T112, T113, T115, T116, T118, T119, T121 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all parallel US1 tasks together:
Task: "Update hooks/usePageConfig.tsx to include new PageProps fields"
Task: "Update hooks/usePageQueries.ts to use stable memoized query/mutation references"
Task: "Update hooks/useFormPage.ts to integrate use-debounce"
Task: "Update hooks/usePageUtiles.tsx to work with new dependency tracking"
Task: "Update components/ContentRenderer.tsx to track content item dependencies"
Task: "Update components/RenderComponent.tsx to support new ContentItem fields"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (12 tasks, ~2-3 hours)
2. Complete Phase 2: Foundational (17 tasks, ~1-2 days) - CRITICAL, blocks all stories
3. Complete Phase 3: User Story 1 (14 tasks, ~1-2 days)
4. **STOP and VALIDATE**: Test US1 independently - basic page configuration should work on web and React Native
5. Optional: Deploy/demo MVP with just core functionality

**Total MVP Effort**: ~3-5 days (43 tasks)

### Incremental Delivery

1. **Foundation** (Phases 1-2): Setup + infrastructure → ~2-3 days
2. **MVP** (Phase 3): User Story 1 → Test independently → ~1-2 days → Deploy/Demo
3. **Performance** (Phase 4): User Story 2 → Test independently → ~1-2 days → Deploy/Demo
4. **SEO** (Phase 5): User Story 3 → Test independently → ~1-2 days → Deploy/Demo
5. **Customization** (Phase 6): User Story 4 → Test independently → ~1-2 days → Deploy/Demo
6. **Lazy Loading** (Phase 7): User Story 5 → Test independently → ~1-2 days → Deploy/Demo
7. **Polish** (Phase 8): Final improvements → ~1-2 days → Release 2.0.0

**Total Effort**: ~10-15 days (123 tasks)

### Parallel Team Strategy

With multiple developers after Foundational phase completes:

- **Developer A**: User Story 1 (Phase 3) - 14 tasks
- **Developer B**: User Story 2 (Phase 4) - 14 tasks (can start after Phase 2)
- **Developer C**: User Story 3 (Phase 5) - 16 tasks (can start after Phase 2)
- **Developer D**: Works on User Story 4 after US1 completes
- **Developer E**: Works on User Story 5 after US1 completes

**Parallel Completion Time**: ~5-8 days (instead of 10-15 sequential)

---

## Task Count Summary

- **Phase 1 (Setup)**: 12 tasks
- **Phase 2 (Foundational)**: 17 tasks
- **Phase 3 (User Story 1)**: 14 tasks
- **Phase 4 (User Story 2)**: 14 tasks
- **Phase 5 (User Story 3)**: 16 tasks
- **Phase 6 (User Story 4)**: 15 tasks
- **Phase 7 (User Story 5)**: 15 tasks
- **Phase 8 (Polish)**: 20 tasks

**Total**: 123 tasks

**Parallel Tasks** (marked [P]): 68 tasks (55% of total can run in parallel within phases/stories)

---

## Notes

- All tasks follow strict format: `- [ ] [ID] [P?] [Story?] Description with file path`
- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Tests are NOT included (not requested in spec, per research.md)
- Test infrastructure setup IS included (Constitution requirement)
- Stop at any checkpoint to validate story independently
- Bundle size targets: < 60 KB main, < 25 KB per module
- Performance targets: 60 FPS, max 3 re-renders per change
- Cross-platform compatibility validated at every checkpoint
