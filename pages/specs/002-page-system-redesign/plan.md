# Implementation Plan: Universal Page System Redesign

**Branch**: `002-page-system-redesign` | **Date**: 2025-10-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-page-system-redesign/spec.md`

## Summary

This feature represents a comprehensive redesign of the react-base-pages library to create a universal, high-performance page system that works seamlessly across web and React Native platforms. The system maintains and extends the existing PageProps interface as the primary configuration API while adding advanced features for performance optimization, SEO/AI metadata generation, lazy loading, and complete customization capabilities. The redesign prioritizes rendering performance through intelligent memoization, dependency tracking, and selective re-rendering strategies.

**Primary Requirement**: Build a unified page configuration system that enables developers to create complex pages with forms, queries, and dynamic content through a single declarative PageProps interface that renders optimally on both web (React DOM) and React Native platforms.

**Technical Approach**: Leverage React 19's automatic batching and compiler optimizations, implement a dependency graph for selective re-rendering, create platform adapters for cross-platform compatibility, integrate metadata management with document head manipulation (web) and graceful degradation (native), and establish modular architecture with tree-shakeable exports for optimal bundle sizes.

## Technical Context

**Language/Version**: TypeScript 5.8.3, React 19.2.0 (React 18+ for React Native support)
**Primary Dependencies**:
- **Core**: React 19.2.0, TypeScript 5.8.3
- **Internal**: @gaddario98/react-auth@1.0.16, @gaddario98/react-form@1.0.21, @gaddario98/react-queries@1.0.21, @gaddario98/utiles@1.0.15
- **External**: @tanstack/react-query@5.90.2, react-hook-form@7.64.0, react-i18next@16.0.1
- **Build**: Rollup 4.40.0, babel-plugin-react-compiler@1.0.0 (React Compiler enabled)
- **Performance**: [NEEDS CLARIFICATION: react-intersection-observer or similar for lazy loading triggers]
- **Metadata**: [NEEDS CLARIFICATION: react-helmet-async, next/head adapter, or custom metadata manager]
- **State Management**: @gaddario98/react-state [if needed per user request]

**Storage**: N/A (library delegates data management to TanStack Query via @gaddario98/react-queries)
**Testing**: [NEEDS CLARIFICATION: User stated no tests implemented yet - need to establish testing strategy for this redesign]
**Target Platform**: Web (React DOM 19+) and React Native (18+), dual-bundle output (CommonJS + ESM)
**Project Type**: Component library with modular exports (hooks, components, config, utils)
**Performance Goals**:
- 60 FPS (16ms per render) on mid-range mobile devices
- Initial bundle < 60 KB gzipped (complete), < 25 KB per module
- Max 3 component re-renders per state change in complex pages
- 40% faster load time with lazy loading vs. eager loading
- Metadata injection before first contentful paint (web)

**Constraints**:
- Backward compatibility with existing PageProps interface required
- Zero implementation details in public API (library consumers provide UI components)
- Cross-platform performance parity (optimizations work on both web and native)
- Tree-shakeable exports (sideEffects: false, targeted imports)
- React Compiler compatibility (babel-plugin-react-compiler enabled)

**Scale/Scope**:
- Target: Pages with 10+ content sections, 5+ queries, 20+ form fields
- Bundle entry points: 5 (main, components, hooks, config, utils)
- Platform adapters: 2 (web, React Native)
- Metadata formats: 4+ (basic meta, Open Graph, JSON-LD, AI hints)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ I. Component Library First

**Status**: PASS

- **Compliance**: This feature redesigns the library to provide reusable, self-contained components (PageGenerator, ContentRenderer, platform adapters) with explicit TypeScript interfaces (PageProps, ContentItem, MappedProps).
- **Verification**: All components export through defined package.json entry points (./components, ./hooks, ./config, ./utils). No application-level state dependencies; configuration is purely declarative via PageProps.

### ✅ II. TypeScript Strict Mode (NON-NEGOTIABLE)

**Status**: PASS

- **Compliance**: Project already enforces TypeScript 5.8.3 with strict mode. All new code will maintain `"strict": true`, explicit typing for all props/returns, no `any` types in public APIs.
- **Verification**: Build gate (`tsc --noEmit`) will catch violations. Type definitions (`.d.ts`) included in all exports.

### ⚠️ III. Test Coverage & Reliability (NON-NEGOTIABLE)

**Status**: CONDITIONAL PASS (requires action)

- **Current State**: User confirmed no tests implemented yet ("Non è stato implementato nessun test per ora").
- **Required Action**: This redesign MUST establish testing infrastructure as part of Phase 1/2:
  - Install and configure `vitest` + `@testing-library/react` + `@testing-library/react-native`
  - Minimum 80% coverage for new/modified code
  - 100% coverage of exported public APIs (PageGenerator, hooks, utilities)
  - Test cases for all 5 user stories' acceptance scenarios
- **Justification**: This is a complete redesign affecting core rendering logic. Without tests, we cannot guarantee SC-003 (60 FPS performance), SC-004 (max 3 re-renders), or backward compatibility (FR-006).
- **Mitigation**: Phase 1 will include test infrastructure setup; Phase 2 tasks will include test implementation for each component/hook.

### ✅ IV. Performance & Bundle Optimization

**Status**: PASS

- **Compliance**:
  - Rollup already configured for dual output (CJS + ESM)
  - `sideEffects: false` in package.json
  - Bundle size targets: < 60 KB main, < 25 KB per module (stricter than constitution's < 50 KB / < 20 KB)
  - React Compiler (babel-plugin-react-compiler) enabled for automatic memoization
  - Explicit memoization strategy in FR-007 through FR-013
- **Verification**: rollup-plugin-filesize and rollup-plugin-visualizer already installed for monitoring.

### ✅ V. Breaking Change Management

**Status**: PASS (with documentation requirement)

- **Compliance**:
  - FR-006 explicitly requires maintaining backward compatibility with existing PageProps interface
  - Spec acknowledges this is a major redesign (Assumption #10: "some breaking changes acceptable if they provide value and clear migration path")
  - Version will be MAJOR bump (likely 2.0.0) given scope
- **Required Action**:
  - Phase 1 must document all breaking changes in a MIGRATION.md file
  - Deprecated APIs kept for one minor version with console warnings
  - Changelog entry with before/after examples
- **Verification**: Pre-publish checklist will validate migration documentation exists.

## Project Structure

### Documentation (this feature)

```text
specs/002-page-system-redesign/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output: Technology decisions and best practices
├── data-model.md        # Phase 1 output: Type system and entity relationships
├── quickstart.md        # Phase 1 output: Developer integration guide
├── contracts/           # Phase 1 output: TypeScript API contracts and examples
│   ├── PageProps.ts     # Complete PageProps interface with all extensions
│   ├── ContentItems.ts  # Content item types and dependency declarations
│   ├── MappedProps.ts   # Mapped props interface for custom functions
│   ├── Metadata.ts      # Metadata configuration types
│   ├── PlatformAdapter.ts # Platform abstraction interface
│   └── examples/        # Working code examples for each contract
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Component Library Structure (existing, extended for redesign)
packages/react-base-pages/
├── index.ts             # Main entry point (all exports)
├── types.ts             # Core TypeScript definitions (extended PageProps)
│
├── components/          # Renderable components (export: ./components)
│   ├── index.ts
│   ├── PageGenerator.tsx       # Main page orchestrator (P1)
│   ├── ContentRenderer.tsx     # Content item renderer (P1, P2)
│   ├── Container.tsx           # Layout containers (existing, optimized)
│   ├── RenderComponent.tsx     # Individual content renderer (existing, optimized)
│   ├── LazyContent.tsx         # Lazy loading wrapper with Suspense (P5)
│   ├── MetadataManager.tsx     # Metadata injection component (P3)
│   └── ErrorBoundary.tsx       # Error boundary for lazy content (P5)
│
├── hooks/               # React hooks (export: ./hooks)
│   ├── index.ts
│   ├── usePageConfig.tsx       # Main configuration hook (P1, existing, refactored)
│   ├── usePageQueries.ts       # Query management (P1, existing, optimized)
│   ├── useFormPage.ts          # Form integration (P1, existing, optimized)
│   ├── usePageUtiles.tsx       # Utilities hook (existing, optimized)
│   ├── useGenerateContentRender.tsx # Content generation (existing, refactored)
│   ├── useDataExtractor.tsx    # Data extraction (existing, optimized)
│   ├── useDependencyGraph.ts   # Dependency tracking for re-render optimization (P2, NEW)
│   ├── useMemoizedProps.ts     # Stable props memoization (P2, NEW)
│   ├── useMetadata.ts          # Metadata management hook (P3, NEW)
│   ├── usePlatformAdapter.ts   # Platform detection and adaptation (P1, NEW)
│   └── useLifecycleCallbacks.ts # Lifecycle hooks (P4, NEW)
│
├── config/              # Configuration and adapters (export: ./config)
│   ├── index.ts
│   ├── types.ts         # Configuration types (existing, extended)
│   ├── metadata.ts      # Metadata config (existing, extended)
│   ├── platformAdapters/ # Platform-specific implementations (NEW)
│   │   ├── index.ts
│   │   ├── web.ts       # Web platform adapter (document head, React DOM)
│   │   ├── native.ts    # React Native adapter (graceful metadata no-ops)
│   │   └── base.ts      # Base adapter interface
│   └── defaults.ts      # Default component configurations (NEW)
│
├── utils/               # Utility functions (export: ./utils)
│   ├── index.ts
│   ├── optimization.ts  # Performance utilities (existing, extended)
│   ├── lazy.tsx         # Lazy loading utilities (existing, extended)
│   ├── merge.ts         # Configuration merging (existing)
│   ├── dependencyGraph.ts # Dependency graph implementation (P2, NEW)
│   ├── metadataInjection.ts # Metadata injection utilities (P3, NEW)
│   ├── platformDetection.ts # Platform detection (P1, NEW)
│   └── memoization.ts   # Memoization helpers (P2, NEW)
│
├── tests/               # Test suites (NEW - to be created)
│   ├── unit/            # Unit tests for hooks, utils, components
│   ├── integration/     # Integration tests for full page workflows
│   └── performance/     # Performance benchmarks (re-render counts, bundle size)
│
├── dist/                # Build output (generated by Rollup)
│   ├── index.js|mjs|d.ts
│   ├── components/index.js|mjs|d.ts
│   ├── hooks/index.js|mjs|d.ts
│   ├── config/index.js|mjs|d.ts
│   └── utils/index.js|mjs|d.ts
│
├── rollup.config.js     # Build configuration (existing, may need updates)
├── rollup.dts.config.js # Type definition bundling (existing)
├── tsconfig.json        # TypeScript configuration (existing, strict mode)
└── package.json         # Dependencies and exports (existing, may need updates)
```

**Structure Decision**: Component library structure maintained from existing project. This is a library redesign, not a new project, so we extend the existing architecture rather than replace it. The structure follows the constitution's Component Library First principle with explicit exports for each module (./components, ./hooks, ./config, ./utils). New directories added for platform adapters (`config/platformAdapters/`) and test infrastructure (`tests/`). Existing files will be refactored and optimized; new files added for metadata management, dependency tracking, and platform abstraction.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| III. Test Coverage (Missing) | No tests currently implemented in project. Redesign requires testing infrastructure to validate performance claims (SC-003: 60 FPS, SC-004: max 3 re-renders), prevent regressions, and ensure backward compatibility. | Cannot ship library redesign without tests. Constitution requires 80% coverage and 100% public API coverage. Performance benchmarks are measurable success criteria that require automated testing. |
| Additional Complexity: Dependency Graph (NEW utility) | Performance requirement (FR-008) to track which content items depend on which queries/form values for selective re-rendering. Needed to achieve SC-004 (max 3 re-renders per change). | Simpler approach (React context for all data) rejected because it causes full subtree re-renders on any change, violating performance targets. Dependency tracking enables surgical updates. |
| Additional Complexity: Platform Adapters (NEW abstraction) | Cross-platform requirement (FR-002, FR-031-035) to support both web and React Native from same PageProps config. Metadata injection (FR-016) requires platform-specific implementations (document head on web, no-op on native). | Simpler approach (web-only library) rejected because user explicitly requested "per una pagina web o react native". Platform adapters centralize platform differences and enable 90% code reuse (SC-002). |

**Justification Summary**: All complexity additions directly address functional requirements and success criteria from the specification. The dependency graph and platform adapters are not over-engineering; they are the minimal architecture needed to satisfy cross-platform support and performance targets. Test infrastructure is a constitution requirement that must be addressed regardless of current project state.

## Phase 0: Research & Technology Decisions

**Objective**: Resolve all NEEDS CLARIFICATION items from Technical Context and establish best practices for new technologies.

### Research Tasks

1. **Lazy Loading Strategy** (addresses FR-021 through FR-025)
   - **Decision Required**: Choose lazy loading trigger mechanism and intersection observer library
   - **Options to Evaluate**:
     - react-intersection-observer (popular, 60KB, TypeScript support)
     - react-cool-inview (smaller, 20KB, hooks-based)
     - Native IntersectionObserver API with custom hook (zero dependencies)
   - **Evaluation Criteria**: Bundle size impact, React 19 compatibility, SSR support, TypeScript definitions
   - **Output**: Recommendation with rationale in research.md

2. **Metadata Management Architecture** (addresses FR-014 through FR-020)
   - **Decision Required**: Choose metadata injection strategy for web and React Native
   - **Options to Evaluate**:
     - react-helmet-async (popular, SSR support, 50KB)
     - next/head integration pattern (Next.js-specific)
     - Custom metadata manager with native DOM manipulation (zero dependencies)
     - Platform adapter pattern with pluggable implementations
   - **Evaluation Criteria**: SSR compatibility, React Native no-op strategy, bundle size, TypeScript support, JSON-LD support
   - **Output**: Architecture decision with implementation patterns in research.md

3. **Testing Infrastructure Setup** (addresses Constitution Check III)
   - **Decision Required**: Establish testing framework and strategy for library testing
   - **Options to Evaluate**:
     - vitest + @testing-library/react + @testing-library/react-native
     - jest + @testing-library/react (existing ecosystem standard)
     - Component benchmarking tools (React DevTools Profiler, why-did-you-render)
   - **Evaluation Criteria**: React 19 support, TypeScript integration, performance profiling capabilities, cross-platform testing
   - **Output**: Test setup plan with coverage targets in research.md

4. **State Management Decision** (@gaddario98/react-state)
   - **Decision Required**: Determine if @gaddario98/react-state is needed for this redesign
   - **Context**: User mentioned "Come storage installa @gaddario98/react-state se serve"
   - **Analysis Required**:
     - Current state management: TanStack Query (queries), React Hook Form (forms), React Context (minimal)
     - New requirements: Dependency graph (local state), metadata state (page-level), platform config (static)
     - Evaluate if existing solutions sufficient or if @gaddario98/react-state adds value
   - **Output**: Decision with justification in research.md

5. **React Compiler Best Practices** (babel-plugin-react-compiler already enabled)
   - **Decision Required**: Best practices for writing React Compiler-compatible code
   - **Research Areas**:
     - Memoization patterns that work with compiler (avoid redundant useMemo/useCallback?)
     - Performance profiling to validate compiler optimizations
     - Edge cases where manual memoization still needed
   - **Evaluation Criteria**: Compatibility with dependency tracking, impact on bundle size, debugging capabilities
   - **Output**: Coding guidelines in research.md

6. **Additional Performance Libraries** (user requested: "Cerca altre librerie se servono per ottimizzare")
   - **Decision Required**: Identify additional optimization libraries beyond existing stack
   - **Options to Evaluate**:
     - use-debounce (form field optimization)
     - react-fast-compare (deep equality checks for memoization)
     - immer (immutable state updates)
     - react-window or react-virtualized (list virtualization, if needed for content arrays)
   - **Evaluation Criteria**: Bundle size cost vs. performance benefit, React Compiler compatibility, specific use cases in this library
   - **Output**: Approved libraries list with use cases in research.md

**Phase 0 Deliverable**: `research.md` with all decisions documented in format:
- **Decision**: [chosen approach]
- **Rationale**: [why chosen based on evaluation criteria]
- **Alternatives Considered**: [other options and why rejected]
- **Implementation Notes**: [integration patterns, configuration, caveats]

## Phase 1: Design & Contracts

**Prerequisites**: research.md completed, all NEEDS CLARIFICATION resolved

### 1.1 Data Model (data-model.md)

**Objective**: Define TypeScript type system, entity relationships, and state transitions for the redesigned page system.

#### Core Entities (from spec Key Entities section)

1. **PageProps<F, Q>** (Central Configuration)
   - **Fields**:
     - `id: string` (required, unique page identifier)
     - `ns?: string` (optional, i18n namespace)
     - `queries?: QueryPageConfigArray<F, Q>` (query/mutation definitions)
     - `form?: FormPageProps<F, Q>` (form configuration)
     - `contents?: ContentItemsType<F, Q>` (content items or mapping function)
     - `viewSettings?: ViewSettings | MappedItemsFunction<F, Q, ViewSettings>` (layout config)
     - `meta?: MetadataConfig<F, Q>` (NEW: metadata configuration)
     - `onValuesChange?: MappedItemsFunction<F, Q, void>` (lifecycle callback)
     - `enableAuthControl?: boolean` (auth integration flag)
     - `lazyLoading?: LazyLoadingConfig` (NEW: lazy loading config)
     - `platformOverrides?: PlatformOverrides<F, Q>` (NEW: platform-specific config)
   - **Relationships**: Contains FormPageProps, ContentItems, ViewSettings, MetadataConfig
   - **Validation Rules**:
     - `id` must be non-empty string
     - At least one of `contents`, `form`, or `queries` should be defined (empty page warning)
     - `usedQueries` in content items must reference keys from `queries` array
   - **Type Safety**: Generic over `F extends FieldValues` and `Q extends QueriesArray` for full type inference

2. **ContentItem<F, Q>** (Individual Renderable Units)
   - **Variants** (discriminated union):
     - `{ type: "custom", component: JSX.Element | MappedFunction, ...metadata }`
     - `{ type: "container", items: ContentItemsType<F, Q>, component?: ContainerComponent, ...metadata }`
   - **Common Fields** (dependency tracking):
     - `usedQueries?: Array<Q[number]["key"]>` (which queries this item depends on)
     - `usedFormValues?: Array<keyof F>` (which form fields this item depends on)
     - `index?: number` (render order)
     - `usedBoxes?: number` (layout hint)
     - `renderInFooter?: boolean` (slot positioning)
     - `renderInHeader?: boolean` (slot positioning)
     - `isDraggable?: boolean` (interaction flag)
     - `isInDraggableView?: boolean` (context flag)
     - `hidden?: boolean` (conditional visibility)
     - `key?: string` (React key override)
     - `lazy?: boolean` (NEW: lazy loading flag)
   - **Relationships**: Referenced by PageProps.contents, can contain other ContentItems (containers)
   - **Validation Rules**:
     - `usedQueries` keys must exist in parent PageProps.queries
     - `usedFormValues` keys must exist in form field definitions
     - Circular dependencies detected and warned (edge case from spec)

3. **MappedProps<F, Q>** (Dynamic Function Context)
   - **Fields**:
     - `formValues: F` (current form state)
     - `setValue: UseFormSetValue<F>` (form field updater)
     - `allQuery: MultipleQueryResponse<Q>` (all query responses)
     - `allMutation: AllMutation<Q>` (all mutation functions)
   - **Usage**: Passed to all mapping functions (contents mapper, viewSettings mapper, onValuesChange)
   - **Relationships**: Derived from PageProps configuration and runtime state
   - **Memoization**: Must be stable across renders (FR-009, FR-011) - implemented with useMemo

4. **DependencyGraph** (Performance Optimization)
   - **Fields**:
     - `nodes: Map<string, DependencyNode>` (component ID to dependencies)
   - **Methods**:
     - `addNode(node: DependencyNode): void` (register component)
     - `getNode(componentId: string): DependencyNode | undefined` (lookup)
     - `getAffectedComponents(changedKeys: string[]): string[]` (find components to re-render)
   - **DependencyNode**:
     - `componentId: string`
     - `usedQueries: string[]`
     - `usedFormValues: string[]`
     - `usedMutations: string[]`
     - `parentComponent: string | null`
     - `childComponents: string[]`
   - **Relationships**: Built from ContentItem dependency declarations, used by ContentRenderer for selective rendering
   - **State Transitions**: Graph built on mount, updated on content changes, queried on data/form updates

5. **MetadataConfig<F, Q>** (SEO and AI Metadata)
   - **Fields**:
     - `title?: string | MappedItemsFunction<F, Q, string>` (page title)
     - `description?: string | MappedItemsFunction<F, Q, string>` (meta description)
     - `documentLang?: string` (HTML lang attribute)
     - `keywords?: string[] | MappedItemsFunction<F, Q, string[]>` (meta keywords)
     - `openGraph?: OpenGraphConfig<F, Q>` (Open Graph tags)
     - `structuredData?: StructuredDataConfig<F, Q>` (JSON-LD)
     - `aiHints?: AIHintsConfig<F, Q>` (NEW: AI crawler hints)
     - `robots?: RobotsConfig` (indexing directives)
     - `customMeta?: MetaTag[] | MappedItemsFunction<F, Q, MetaTag[]>` (arbitrary meta tags)
   - **Sub-types**:
     - `OpenGraphConfig`: { type, title, description, image, url, siteName }
     - `StructuredDataConfig`: { type: "Article" | "Product" | "WebPage", schema: object }
     - `AIHintsConfig`: { contentClassification?, modelHints?, contextualInfo? }
     - `RobotsConfig`: { noindex?, nofollow?, noarchive? }
     - `MetaTag`: { name?: string, property?: string, content: string }
   - **Relationships**: Embedded in PageProps, consumed by MetadataManager component
   - **Validation Rules**: At least one metadata field should be defined if meta prop exists

6. **PlatformAdapter** (Cross-Platform Abstraction)
   - **Interface**:
     - `name: "web" | "native"` (platform identifier)
     - `injectMetadata(metadata: MetadataConfig): void` (platform-specific injection)
     - `renderContainer(children: ReactNode, settings: ViewSettings): ReactNode` (layout wrapper)
     - `renderScrollView(children: ReactNode, settings: ViewSettings): ReactNode` (scrollable container)
     - `supportsFeature(feature: PlatformFeature): boolean` (capability check)
   - **PlatformFeature**: `"metadata" | "lazyLoading" | "suspense" | "documentHead"`
   - **Relationships**: Injected via config, consumed by PageGenerator and MetadataManager
   - **State**: Stateless, purely functional adapter pattern

#### State Transitions

1. **Page Lifecycle**:
   - `Unmounted` → `Initializing` (PageGenerator mounts)
   - `Initializing` → `Loading` (queries execute, form initializes)
   - `Loading` → `Ready` (all required queries succeed, form defaults applied)
   - `Ready` → `Updating` (user interaction, query refetch)
   - `Updating` → `Ready` (state updates complete)
   - `Ready` → `Error` (mutation failure, query error)
   - `Error` → `Ready` (error recovery, retry)

2. **Metadata Lifecycle**:
   - `Static Metadata` → `Document Head` (initial render, web only)
   - `Query Loads` → `Dynamic Metadata Update` (mapped metadata re-evaluated)
   - `Form Changes` → `Dynamic Metadata Update` (if metadata depends on form values)
   - `Platform Native` → `No-op` (metadata calls on React Native silently ignored)

3. **Lazy Content Lifecycle**:
   - `Not Visible` → `Intersection Detected` (lazy trigger fires)
   - `Intersection Detected` → `Loading` (React.lazy() downloads bundle)
   - `Loading` → `Rendered` (component code loaded, Suspense resolves)
   - `Rendered` → `Hidden` (conditional visibility changes)
   - `Hidden` → `Not Visible` (component unmounts)

**Deliverable**: `data-model.md` with complete type definitions, entity relationship diagrams (textual), validation rules, and state machine descriptions.

### 1.2 API Contracts (contracts/ directory)

**Objective**: Generate TypeScript interface definitions with JSDoc documentation and working code examples.

#### Contract Files

1. **contracts/PageProps.ts**
   - Complete PageProps interface with all new fields (meta, lazyLoading, platformOverrides)
   - Generic type parameters explained
   - JSDoc comments for each field with usage examples
   - Backward compatibility notes

2. **contracts/ContentItems.ts**
   - ContentItem discriminated union with all variants
   - Dependency tracking fields (usedQueries, usedFormValues) explained
   - Lazy loading integration
   - Container vs. custom item patterns

3. **contracts/MappedProps.ts**
   - MappedProps interface
   - MappedItemsFunction type signature
   - Usage examples for mapping functions
   - Memoization best practices

4. **contracts/Metadata.ts**
   - MetadataConfig and all sub-types
   - OpenGraph, JSON-LD, AI hints configurations
   - Static vs. dynamic metadata patterns
   - Platform-specific considerations

5. **contracts/PlatformAdapter.ts**
   - PlatformAdapter interface
   - Web and Native adapter signatures
   - Feature detection patterns
   - Custom adapter implementation guide

6. **contracts/examples/** (working code)
   - `basic-page.tsx`: Simple page with queries and form
   - `metadata-page.tsx`: Page with dynamic metadata and SEO
   - `lazy-page.tsx`: Page with lazy-loaded conditional content
   - `custom-adapter.tsx`: Custom platform adapter example
   - `performance-optimized.tsx`: Page with explicit dependency tracking

**Deliverable**: `contracts/` directory with all TypeScript contracts and working examples.

### 1.3 Quickstart Guide (quickstart.md)

**Objective**: Provide step-by-step integration guide for developers adopting the redesigned system.

**Sections**:
1. **Installation**: Package installation, peer dependencies
2. **Basic Usage**: Simplest working page example
3. **Configuration**: PageProps walkthrough with common patterns
4. **Performance**: Dependency tracking and memoization guidance
5. **Metadata**: SEO and AI metadata setup
6. **Lazy Loading**: Code splitting configuration
7. **Platform Adapters**: Web vs. React Native setup
8. **Migration**: Upgrading from 1.x to 2.x with breaking changes guide
9. **Troubleshooting**: Common issues and solutions

**Deliverable**: `quickstart.md` with complete developer onboarding documentation.

### 1.4 Agent Context Update

**Objective**: Update CLAUDE.md (or equivalent agent context file) with new technologies and patterns from this feature.

**Action**: Run `.specify/scripts/bash/update-agent-context.sh claude`

**Expected Updates**:
- Add new dependencies from research.md decisions (e.g., intersection observer library, metadata manager)
- Document new architectural patterns (dependency graph, platform adapters)
- Update performance guidelines with React Compiler best practices
- Add testing strategy and coverage targets
- Document breaking changes and migration path

**Deliverable**: Updated agent context file reflecting all Phase 1 decisions.

## Phase 2: Task Generation

**Note**: Phase 2 is NOT executed by `/speckit.plan`. The user will run `/speckit.tasks` after reviewing this plan.

**Objective**: Generate actionable, prioritized tasks.md based on the design artifacts created in Phase 1.

**Prerequisites**: plan.md, research.md, data-model.md, quickstart.md, contracts/ all completed and reviewed.

**Execution**: User runs `/speckit.tasks` command, which generates tasks.md with:
- Task breakdown aligned with 5 user stories (P1 through P5)
- Each task references specific functional requirements (FR-xxx) and success criteria (SC-xxx)
- Test requirements integrated into each task
- Dependency graph showing task order and parallelization opportunities
- Estimated complexity and time for each task

**Deliverable** (Phase 2, separate command): `tasks.md` with implementation task list.

## Constitution Re-Check (Post-Design)

**Re-evaluate after Phase 1 design artifacts are complete**:

### ✅ I. Component Library First
- **Verification**: Review contracts/ to ensure all exports are self-contained
- **Check**: PageProps interface has no application-specific assumptions
- **Status**: EXPECTED PASS (design enforces this principle)

### ✅ II. TypeScript Strict Mode
- **Verification**: All contracts/ files compile with strict mode
- **Check**: No `any` types in public APIs
- **Status**: EXPECTED PASS (contract generation enforces types)

### ⚠️ III. Test Coverage & Reliability
- **Verification**: Test strategy documented in research.md
- **Check**: Test infrastructure setup task added to Phase 2 tasks
- **Status**: CONDITIONAL PASS (pending Phase 2 implementation)
- **Blocker**: Cannot merge without test infrastructure (per constitution)

### ✅ IV. Performance & Bundle Optimization
- **Verification**: Bundle size analysis plan in research.md
- **Check**: Lazy loading strategy reduces initial bundle
- **Status**: EXPECTED PASS (research phase validates approach)

### ✅ V. Breaking Change Management
- **Verification**: Migration guide in quickstart.md
- **Check**: Backward compatibility strategy documented in contracts/PageProps.ts
- **Status**: EXPECTED PASS (migration path required in Phase 1)

## Next Steps

After this command completes, review:
1. **research.md**: Validate technology decisions before proceeding
2. **data-model.md**: Ensure type system covers all requirements
3. **contracts/**: Review TypeScript interfaces for completeness
4. **quickstart.md**: Validate developer experience and migration clarity

Then run:
```bash
/speckit.tasks
```

This will generate tasks.md with the implementation plan broken down into actionable tasks aligned with the 5 user stories and 35 functional requirements.

**Critical Path**:
- Phase 0 (research.md) → Phase 1 (design artifacts) → **STOP FOR REVIEW**
- User reviews and approves design
- Phase 2 (/speckit.tasks) → Implementation (/speckit.implement or manual)

**Estimated Timeline** (to be refined in tasks.md):
- Phase 0: 1 day (research and decision-making)
- Phase 1: 2 days (design and contract generation)
- Phase 2: 5-7 days (implementation across P1-P5 user stories)
- Testing: 2-3 days (new infrastructure + coverage)
- Documentation: 1 day (README updates, migration guide)
- **Total**: ~2 weeks for complete redesign with testing
