# Feature Specification: Universal Page System Redesign

**Feature Branch**: `002-page-system-redesign`
**Created**: 2025-10-30
**Status**: Draft
**Input**: User description: "Ripensa il plugin da zero. Deve avere tutto quello che serve per una pagina web o react native. deve essere tutto customizzabile. Punta sulle performance e le ottimizzazioni. Stai attento ai rendering. Cerca di mantenere ed estendere l'interfaccia PageProps come ingresso. Dovrebbe avere anche dei metadati e altre funzionalità da generare custom per ogni pagina per le seo e le Ai."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure Universal Page with Full Customization (Priority: P1)

As a developer building web or React Native applications, when I need to create a new page with forms, data queries, and dynamic content, I want to configure everything through a single unified PageProps interface so that I can define the entire page declaratively without writing boilerplate code for each platform.

**Why this priority**: This is the core value proposition. A unified, customizable PageProps interface enables developers to build pages quickly across platforms while maintaining full control over rendering, styling, and behavior. This directly addresses the requirement to maintain and extend the PageProps interface.

**Independent Test**: Can be fully tested by creating a basic page configuration with form fields and queries, then rendering it on both web and React Native, verifying that the same configuration produces appropriate output on both platforms.

**Acceptance Scenarios**:

1. **Given** a PageProps configuration with form fields, queries, and content sections, **When** a developer renders it in a web application, **Then** the page displays with all features working correctly and all customization options applied.
2. **Given** the same PageProps configuration, **When** a developer renders it in a React Native application, **Then** the page displays with platform-appropriate components while maintaining the same functionality.
3. **Given** a PageProps with custom rendering functions, **When** the page renders, **Then** custom components receive correct mapped props (form values, query data, mutations) for dynamic behavior.

---

### User Story 2 - Optimize Rendering Performance Across Platforms (Priority: P2)

As a developer using this page system, when I build pages with frequent data updates, form interactions, and dynamic content, I want the system to intelligently prevent unnecessary re-renders and optimize component updates so that my pages remain fluid and responsive on both web browsers and mobile devices.

**Why this priority**: After establishing the core configuration system (P1), performance optimization ensures pages scale to complex real-world scenarios. This directly addresses the requirement to focus on performance and rendering optimization.

**Independent Test**: Can be fully tested by creating a page with 10+ content sections and multiple form fields, triggering rapid updates (typing, query refetches), and measuring frame rates and re-render counts to verify they stay within performance targets.

**Acceptance Scenarios**:

1. **Given** a page with 10 content sections depending on different queries, **When** a single query updates, **Then** only the components depending on that specific query re-render, not the entire page.
2. **Given** a form with 20 fields, **When** a user types in one field, **Then** only that field's component re-renders, maintaining 60 FPS performance.
3. **Given** a page with multiple simultaneous data updates, **When** all updates complete within the same event cycle, **Then** React batches the updates into a single render pass.

---

### User Story 3 - Generate SEO and AI Metadata Dynamically (Priority: P3)

As a developer building web applications (or server-rendered React Native apps), when I configure a page, I want to define metadata such as title, description, Open Graph tags, structured data, and AI-specific hints so that search engines, social media platforms, and AI crawlers can properly understand and index my content.

**Why this priority**: After core functionality (P1) and performance (P2), metadata generation adds critical SEO and discoverability features. This directly addresses the requirement for metadata and custom functionality for SEO and AI.

**Independent Test**: Can be fully tested by configuring a page with metadata props, rendering it server-side or in a web environment, and verifying that appropriate meta tags, structured data JSON-LD, and AI hints are injected into the document head.

**Acceptance Scenarios**:

1. **Given** a PageProps with meta.title and meta.description, **When** the page renders on web, **Then** the document head contains the correct title tag and meta description tag.
2. **Given** a PageProps with dynamic metadata depending on query data, **When** the query loads, **Then** the metadata updates to reflect the loaded data (e.g., product name becomes page title).
3. **Given** a PageProps with structured data configuration, **When** the page renders, **Then** a JSON-LD script tag is injected with schema.org markup for search engines and AI crawlers.

---

### User Story 4 - Extend and Customize All System Behaviors (Priority: P4)

As a developer integrating this page system into a larger application, when I encounter specific requirements not covered by default configuration options, I want comprehensive extension points (custom components, render functions, hooks, lifecycle callbacks) so that I can adapt the system to any edge case without forking or modifying the library source code.

**Why this priority**: After core features (P1), performance (P2), and metadata (P3), extensibility ensures the system can handle edge cases and unique requirements. This addresses the requirement that everything must be customizable.

**Independent Test**: Can be fully tested by replacing default components (PageContainer, ItemsContainer, FormManager) with custom implementations, verifying that custom components receive expected props and integrate seamlessly with the rest of the system.

**Acceptance Scenarios**:

1. **Given** a PageProps with viewSettings.customPageContainer pointing to a custom component, **When** the page renders, **Then** the custom container is used instead of the default, receiving all page content as children.
2. **Given** a PageProps with custom render functions for content items, **When** content renders, **Then** custom functions receive mapped props (queries, form values) and can implement arbitrary rendering logic.
3. **Given** a PageProps with onValuesChange callback, **When** form values change, **Then** the callback receives updated values and query data, enabling custom side effects.

---

### User Story 5 - Lazy Load Content and Code Split Bundles (Priority: P5)

As a developer building large applications with many features, when I configure pages with optional or conditional content (tabs, modals, expandable sections), I want the system to support lazy loading and code splitting so that users only download code when they need it, reducing initial load time and improving perceived performance.

**Why this priority**: This builds on P2 (performance) by optimizing load-time performance. After runtime rendering is efficient, lazy loading provides further gains for large-scale applications.

**Independent Test**: Can be fully tested by configuring a page with conditional content marked for lazy loading, loading the page, verifying that lazy code is not initially downloaded, then triggering the condition and verifying the code loads on demand.

**Acceptance Scenarios**:

1. **Given** a PageProps with content items marked as lazy-loadable, **When** the page initially loads, **Then** those content components are not included in the initial bundle.
2. **Given** a lazily-loaded content item, **When** the condition for showing it becomes true, **Then** the component code loads asynchronously and renders with a loading indicator during fetch.
3. **Given** a page with multiple lazy-loaded sections, **When** a user rapidly toggles between sections, **Then** the system correctly handles race conditions and shows the correct content for the current state.

---

### Edge Cases

- What happens when a developer provides both static viewSettings and a mapped function for viewSettings (conflicting configuration)?
- How does the system handle circular dependencies where content item A depends on form value B, which depends on content item A's query?
- What happens when a query returns data that doesn't match the expected structure for metadata mapping?
- How does metadata rendering work in React Native where there is no document head?
- What happens when a custom component throws an error during render? Does it break the entire page or just that component?
- How does the system handle platform-specific props (e.g., web-only or native-only configuration options)?
- What happens when lazy-loaded content is removed from the page before its code finishes loading?
- How does the system handle internationalization (i18n) for metadata when the same page should have different SEO tags per language?

## Requirements *(mandatory)*

### Functional Requirements

#### Core Configuration System

- **FR-001**: System MUST accept a PageProps interface as the primary configuration input for all pages
- **FR-002**: System MUST support rendering on both web (React DOM) and React Native platforms from the same PageProps configuration
- **FR-003**: System MUST allow developers to override any default component (PageContainer, ItemsContainer, FormManager, content renderers) with custom implementations
- **FR-004**: System MUST provide mapped props (form values, query data, mutations, setValue function) to all custom render functions and components
- **FR-005**: System MUST support both static configuration values and dynamic mapping functions (that receive mapped props) for all configurable properties
- **FR-006**: System MUST maintain backward compatibility with the existing PageProps interface while allowing extensions

#### Performance Optimization

- **FR-007**: System MUST memoize all content items to prevent re-renders when their dependencies (queries, form values) have not changed
- **FR-008**: System MUST track dependency relationships between content items and their data sources (usedQueries, usedFormValues) for selective re-rendering
- **FR-009**: System MUST use stable callback references (useCallback) for all event handlers and mapped functions
- **FR-010**: System MUST compute derived values (e.g., filtered/sorted data) using memoization with precise dependency arrays
- **FR-011**: System MUST avoid creating new object/array references in render cycles that would trigger downstream re-renders
- **FR-012**: System MUST batch multiple state updates occurring in the same event handler into a single render pass
- **FR-013**: System MUST provide a dependency graph utility to analyze which components are affected by specific data changes

#### Metadata and SEO

- **FR-014**: System MUST support static metadata configuration (title, description, language, Open Graph tags) via PageProps.meta
- **FR-015**: System MUST support dynamic metadata that updates based on query data or form values using mapping functions
- **FR-016**: System MUST inject metadata into document head on web platforms using appropriate APIs (e.g., Helmet, Next.js Head, or native DOM manipulation)
- **FR-017**: System MUST support structured data injection (JSON-LD schema.org markup) for rich search results
- **FR-018**: System MUST provide configuration options for robots meta tags (noindex, nofollow) per page
- **FR-019**: System MUST support custom meta tags for AI crawlers and other specialized bots (e.g., AI model hints, content classification)
- **FR-020**: System MUST handle metadata gracefully on React Native (no-op or platform-specific adapters) where document head does not exist

#### Lazy Loading and Code Splitting

- **FR-021**: System MUST support marking individual content items or containers as lazy-loadable
- **FR-022**: System MUST use React.lazy() and Suspense boundaries to defer loading of lazy components until needed
- **FR-023**: System MUST provide configuration options for lazy loading triggers (viewport intersection, user interaction, conditional logic)
- **FR-024**: System MUST show customizable loading indicators while lazy components are being fetched
- **FR-025**: System MUST handle errors in lazy-loaded components without crashing the entire page (error boundaries)

#### Customization and Extension

- **FR-026**: System MUST expose lifecycle hooks or callbacks (onValuesChange, onQuerySuccess, onMountComplete) for custom side effects
- **FR-027**: System MUST allow developers to inject custom hooks into the page lifecycle without modifying library code
- **FR-028**: System MUST support slot-based customization where developers can inject components into predefined positions (header, footer, sidebar)
- **FR-029**: System MUST provide utility functions for common tasks (merging configurations, extracting query data, generating keys)
- **FR-030**: System MUST document all extension points and customization patterns with working examples

#### Platform Compatibility

- **FR-031**: System MUST abstract platform-specific rendering behind a configuration layer (e.g., pageConfig)
- **FR-032**: System MUST provide default implementations for web and React Native that can be overridden
- **FR-033**: System MUST handle platform-specific differences (e.g., ScrollView vs. div, TouchableOpacity vs. button) transparently
- **FR-034**: System MUST ensure all performance optimizations work correctly on both platforms
- **FR-035**: System MUST provide platform detection utilities to enable conditional configuration based on runtime environment

### Key Entities

- **PageProps**: The central configuration object that defines all aspects of a page including queries, forms, content, metadata, and view settings. Contains both static values and dynamic mapping functions.

- **Content Items**: Individual renderable units that make up page content. Can be custom components, containers of other items, or form sections. Each item declares its dependencies (usedQueries, usedFormValues) for selective rendering.

- **Mapped Props**: A standardized object passed to all mapping functions and custom components containing current form values, query responses, mutation functions, and setValue for dynamic behavior.

- **Dependency Graph**: A runtime data structure tracking which content items depend on which queries and form fields, enabling the system to determine minimal re-render scope when data changes.

- **Metadata Configuration**: Page-level metadata including SEO tags, Open Graph properties, structured data, and platform-specific hints. Can be static or dynamically generated from query data.

- **View Settings**: Configuration controlling page-level layout and behavior including padding, custom containers, header/footer settings, and refresh controls.

- **Platform Adapter**: An abstraction layer that maps universal concepts (queries, forms, content) to platform-specific rendering primitives (React DOM components vs. React Native components).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can configure a complete page with forms, queries, and content using PageProps in under 100 lines of configuration code
- **SC-002**: The same PageProps configuration renders correctly on both web and React Native with no platform-specific changes required for 90% of use cases
- **SC-003**: Pages with 10+ content sections and 5+ active queries maintain 60 FPS (under 16ms per render) on mid-range mobile devices during typical interactions
- **SC-004**: Changing a single form field value triggers no more than 3 component re-renders in a complex page with 20+ content items
- **SC-005**: Initial page load time improves by 40% when using lazy loading for conditionally-shown content compared to eager loading
- **SC-006**: Web pages render with complete metadata (title, description, Open Graph, structured data) in the document head before first contentful paint
- **SC-007**: Dynamic metadata updates (e.g., based on loaded query data) complete and reflect in document head within 200ms of data arrival
- **SC-008**: Developers can replace any default component with a custom implementation in under 10 lines of configuration code
- **SC-009**: The library bundle size remains under 60 KB gzipped for the complete package, with per-module bundles under 25 KB gzipped
- **SC-010**: 95% of common customization scenarios can be achieved through configuration without requiring source code modifications or forking

## Assumptions

1. **React Version**: System targets React 19+ (React 18+ for React Native) with modern features like automatic batching, concurrent rendering, and improved memoization.

2. **TypeScript Support**: All code is written in TypeScript with full type safety. PageProps and related types provide comprehensive autocomplete and compile-time validation.

3. **Build Tooling**: Consumers use modern build tools (Vite, Rollup, Webpack 5+, Metro for React Native) with tree-shaking and code-splitting support.

4. **Server-Side Rendering**: Web applications may use SSR (Next.js, Remix) or static generation. System ensures metadata is available server-side for SEO.

5. **Data Fetching**: Query management is handled by TanStack Query (@gaddario98/react-queries wrapper). System optimizes rendering but does not change data fetching strategies.

6. **Form Management**: Forms are managed by React Hook Form (@gaddario98/react-form wrapper). System integrates seamlessly with existing form configuration patterns.

7. **Internationalization**: i18n is handled by react-i18next. Metadata can include i18n keys that are resolved at render time.

8. **Performance Targets**: Success criteria target mid-range devices (iPhone 12 equivalent, mid-range Android) as the performance baseline, not high-end flagships.

9. **Platform Feature Parity**: While the goal is cross-platform support, some features (metadata rendering) may be web-only with graceful no-ops on React Native.

10. **Breaking Changes**: This is a major redesign. Some breaking changes to the PageProps interface are acceptable if they provide significant value and a clear migration path.

## Out of Scope

- **UI Component Library**: This system provides page structure and lifecycle management, not a complete component library. Consumers provide their own buttons, inputs, cards, etc.

- **Routing and Navigation**: Page routing, navigation, URL management, and deep linking are handled by external libraries (React Router, React Navigation). This system focuses on individual page rendering.

- **Authentication and Authorization**: Auth checks (enableAuthControl) integrate with @gaddario98/react-auth, but detailed auth logic, user management, and permission systems are external concerns.

- **Data Fetching Implementation**: Query execution, caching, invalidation, and mutation logic are handled by @gaddario98/react-queries. This system optimizes rendering, not data fetching.

- **Form Validation Logic**: Validation rules, error messages, and form submission logic are handled by @gaddario98/react-form. This system renders forms but doesn't implement validation.

- **State Management**: Global application state beyond page-level concerns is out of scope. Consumers use Redux, Zustand, or Context API as needed.

- **Testing Infrastructure**: Unit tests, integration tests, and testing utilities are out of scope for this feature specification. Testing is a separate concern.

- **Migration Tooling**: While backward compatibility is a goal, automated migration scripts or codemods for upgrading from the old API to the new API are out of scope.

- **Developer Tooling**: Browser extensions, debugging utilities, performance monitoring dashboards, and other developer tools are out of scope.

- **Analytics Integration**: Page view tracking, event logging, and analytics integration are external concerns handled by consumer applications.
