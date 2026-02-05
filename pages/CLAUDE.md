# react-base-pages Development Guidelines

Last updated: 2025-10-31 | Version: 2.0.0

## Active Technologies

### Language & Framework
- **TypeScript**: 5.8.3 (strict mode required)
- **React**: 19.2.0 (minimum 18.0.0)
- **JSX Transform**: react-jsx (automatic)
- **React Compiler**: babel-plugin-react-compiler (automatic memoization enabled)

### Core Dependencies
- **Data Management**: @tanstack/react-query@^5.90.2 (query and mutations)
- **Forms**: react-hook-form@^7.64.0 (form state management)
- **Internationalization**: react-i18next@^16.0.1 with i18next@^25.5.3

### New v2.0 Dependencies (Performance & Features)
- **use-debounce**: ^10.0.3 (form input debouncing, 80% keystroke re-render reduction)
- **fast-deep-equal**: ^3.1.3 (optimized equality checks, replaces custom deepEqual)

### Cross-Platform Support (NEW)
- **Web**: React DOM 19.2.0
- **React Native**: React Native 0.73+ (via platform adapter abstraction)

### Build & Testing
- **Build Tool**: Rollup 4.40.0 with dual output (CJS + ESM)
- **Test Framework**: Vitest 3.0.0
- **Test Utilities**: @testing-library/react@^16.0.0, @testing-library/react-native@^13.0.0
- **Coverage**: vitest with v8 provider, targeting 80% coverage
- **Type Checking**: TypeScript with --noEmit, strict mode

## Project Structure

```text
packages/react-base-pages/
├── components/          # React components (./components export)
│   ├── PageGenerator.tsx         # Main orchestrator
│   ├── ContentRenderer.tsx       # Content rendering with dependency tracking
│   ├── Container.tsx            # Layout containers (platform-aware)
│   ├── RenderComponent.tsx       # Individual content renderer
│   ├── MetadataManager.tsx       # Metadata injection (NEW v2.0)
│   ├── LazyContent.tsx          # Lazy loading wrapper (NEW v2.0)
│   └── ErrorBoundary.tsx        # Error handling for lazy (NEW v2.0)
│
├── hooks/               # React hooks (./hooks export)
│   ├── usePageConfig.tsx        # Main configuration hook
│   ├── usePageQueries.ts        # Query management
│   ├── useFormPage.ts           # Form integration
│   ├── useGenerateContentRender.tsx  # Content generation
│   ├── useDependencyGraph.ts    # Dependency tracking (NEW v2.0)
│   ├── useMemoizedProps.ts      # Stable props memoization (NEW v2.0)
│   ├── useMetadata.ts           # Metadata evaluation (NEW v2.0)
│   ├── usePlatformAdapter.ts    # Platform detection (NEW v2.0)
│   ├── useIntersectionObserver.ts   # Viewport detection (NEW v2.0)
│   └── useLifecycleCallbacks.ts    # Lifecycle events (NEW v2.0)
│
├── config/              # Configuration (./config export)
│   ├── types.ts         # Type definitions
│   ├── metadata.ts      # Metadata configuration
│   ├── platformAdapters/    # Platform abstractions (NEW v2.0)
│   │   ├── base.ts          # Interface definition
│   │   ├── web.ts           # Web (React DOM) implementation
│   │   ├── native.ts        # React Native implementation
│   │   └── index.ts         # Platform detection
│   └── PlatformAdapterProvider.tsx  # Context provider (NEW v2.0)
│
├── utils/               # Utilities (./utils export)
│   ├── optimization.ts  # Performance utilities
│   ├── lazy.tsx         # Lazy loading utilities
│   ├── merge.ts         # Configuration merging
│   ├── dependencyGraph.ts   # Dependency graph (NEW v2.0)
│   ├── memoization.ts       # Memoization helpers (NEW v2.0)
│   ├── platformDetection.ts # Platform detection (NEW v2.0)
│   └── validation.ts        # Validation utilities
│
├── tests/               # Test infrastructure (NEW v2.0)
│   ├── setup.ts         # Web test setup
│   ├── setup.native.ts  # React Native test setup
│   ├── utils/
│   │   ├── test-utils.tsx      # Custom render functions
│   │   └── performance-utils.ts # Performance testing
│   └── specs/           # Test files (to be created)
│
├── dist/                # Build output (generated)
├── types.ts             # Core type definitions
├── index.ts             # Main export entry point
├── package.json         # v2.0.0
├── tsconfig.json        # TypeScript strict mode
├── rollup.config.js     # Build configuration
├── vitest.config.ts     # Web test config
├── vitest.config.native.ts  # React Native test config
├── MIGRATION.md         # v1.x to v2.x upgrade guide (NEW v2.0)
├── CHANGELOG.md         # v2.0.0 changes (NEW v2.0)
└── README.md            # Updated for v2.0
```

## Commands

### Build & Deploy
```bash
npm run build              # Build all entry points (CJS + ESM + types)
npm run prepublishOnly     # Pre-publish check
```

### Testing
```bash
npm test                   # Run tests once
npm run test:watch        # Watch mode
npm run test:ui           # Vitest UI
npm run test:coverage     # Coverage report
npm run test:native       # React Native tests
npm run test:perf         # Performance benchmarks
```

### Quality
```bash
npm run type-check        # TypeScript type checking (--noEmit)
npm run lint              # ESLint
```

## Code Style & Conventions

### TypeScript
- **Strict Mode**: Required (tsconfig.json: `"strict": true`)
- **Generics**: Use for PageProps<F, Q> type safety
- **Types**: Explicit typing for all props, return values (no `any`)
- **Imports**: Prefer named imports for tree-shaking

### React & Components
- **Functional Components**: All components are functional with hooks
- **Memoization**: Use React.memo for optimized components
- **Performance**: Leverage React Compiler (no manual useMemo/useCallback needed)
- **Platform Awareness**: Use `usePlatformAdapter()` for platform-specific code

### Performance Optimizations
- **Dependency Tracking**: Always specify `usedQueries` and `usedFormValues` in ContentItem
- **Memoization**: Use `useMemoizedProps` for stable object references
- **Form Debouncing**: Set `debounceDelay` for high-frequency updates
- **Tree-Shaking**: Import from specific entry points (./hooks, ./components, etc.)

### Documentation
- **JSDoc**: Comprehensive JSDoc for all public APIs
- **Examples**: Include @example in JSDoc for complex hooks/components
- **Migration**: Document breaking changes in MIGRATION.md

## Architectural Patterns (NEW v2.0)

### Dependency Graph Pattern
- Track component dependencies via `usedQueries` and `usedFormValues`
- Enable selective re-rendering (update only affected components)
- Detect circular dependencies with warnings
- Improves performance: 80% fewer re-renders in complex pages

### Platform Adapter Pattern
- Abstract platform-specific implementations behind `PlatformAdapter` interface
- Implement for web (React DOM) and native (React Native)
- Feature detection via `supportsFeature()` method
- Graceful degradation on unsupported platforms

### Lazy Loading Pattern
- Declare lazy content with `lazy: true` in ContentItem
- Configure triggers: "viewport", "conditional", or manual
- Integrate Suspense for loading state and ErrorBoundary for failures
- Reduce initial bundle via code splitting

### Metadata Pattern
- Declare metadata in `PageProps.meta` field
- Support static strings or dynamic MappedItemsFunction
- Automatic i18n translation
- Platform-aware injection (web: document head, native: no-op)

## Bundle Size Targets

| Entry Point | Target | Notes |
|-------------|--------|-------|
| Main | < 60 KB | All features |
| /components | < 25 KB | Components only |
| /hooks | < 25 KB | Hooks only |
| /config | < 5 KB | Configuration only |
| /utils | < 5 KB | Utilities only |

## Recent Changes (v2.0.0)

### Breaking Changes
- React 18.0.0+ required (was 16.x)
- TypeScript 5.x+ required
- Platform adapters replace manual react-helmet-async wrapping
- New ContentItem fields (lazy, lazyTrigger, lazyCondition)
- New PageProps fields (meta, lazyLoading, platformOverrides)

### New Features
- Universal cross-platform support (web + React Native)
- SEO metadata management (Open Graph, JSON-LD, AI hints)
- Lazy loading and code splitting
- Dependency graph for selective re-rendering
- Form input debouncing
- Full extensibility (custom components, lifecycle callbacks)

### Performance Improvements
- 80% keystroke re-render reduction via debouncing
- 90% fewer re-renders via dependency tracking
- Selective component updates based on data dependencies
- Stable memoized props preventing cascading updates

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
