/**
 * PageProps Contract
 *
 * Central configuration interface for the Universal Page System.
 * Defines all aspects of a page including queries, forms, content, metadata, and view settings.
 *
 * @template F - Form field values type (extends React Hook Form's FieldValues)
 * @template Q - Query/mutation definitions array type
 *
 * @since 2.0.0
 */

import { FieldValues, UseFormSetValue } from "react-hook-form";
import {
  QueriesArray,
  MultipleQueryResponse,
  AllMutation,
} from "@gaddario98/react-queries";

/**
 * PageProps - Complete page configuration interface
 *
 * This is the primary API for configuring pages in the Universal Page System.
 * It provides a unified, type-safe interface that works across web (React DOM)
 * and React Native platforms.
 *
 * @example
 * ```tsx
 * import { PageProps } from '@gaddario98/react-pages';
 *
 * const myPageConfig: PageProps<MyFormFields, MyQueries> = {
 *   id: 'user-profile-page',
 *   ns: 'userProfile',
 *   queries: [
 *     { type: 'query', key: 'getUser' },
 *     { type: 'mutation', key: 'updateUser', mutationConfig: {} }
 *   ],
 *   form: {
 *     fields: [...],
 *     defaultValues: { ... }
 *   },
 *   contents: [
 *     {
 *       type: 'custom',
 *       component: <UserProfile />,
 *       usedQueries: ['getUser']
 *     }
 *   ],
 *   meta: {
 *     title: 'User Profile',
 *     description: 'Manage your user profile and settings'
 *   }
 * };
 * ```
 */
export interface PageProps<
  F extends FieldValues = FieldValues,
  Q extends QueriesArray = QueriesArray
> {
  /**
   * Unique page identifier
   *
   * Used for React keys, error tracking, analytics, and debugging.
   * Must be unique across your application.
   *
   * @required
   * @example "user-profile-page"
   * @example "product-detail-page-123"
   */
  id: string;

  /**
   * Internationalization namespace
   *
   * The i18n namespace for translations used in this page.
   * Works with react-i18next to scope translations to this page.
   *
   * @optional
   * @default undefined (uses default namespace)
   * @example "userProfile"
   * @example "products"
   */
  ns?: string;

  /**
   * Query and mutation definitions
   *
   * Array of query and mutation configurations for data fetching.
   * Integrates with TanStack Query via @gaddario98/react-queries.
   *
   * Each query/mutation can have static config or dynamic config via mapping functions.
   *
   * @optional
   * @since 1.0.0
   * @example
   * ```tsx
   * queries: [
   *   { type: 'query', key: 'getUser', queryConfig: { enabled: true } },
   *   {
   *     type: 'mutation',
   *     key: 'updateUser',
   *     mutationConfig: {
   *       onSuccess: () => queryClient.invalidateQueries(['getUser'])
   *     }
   *   }
   * ]
   * ```
   */
  queries?: QueryPageConfigArray<F, Q>;

  /**
   * Form configuration
   *
   * Integrates with React Hook Form via @gaddario98/react-form.
   * Defines form fields, validation, default values, and submission handlers.
   *
   * Supports mapping query data to form default values.
   *
   * @optional
   * @since 1.0.0
   * @example
   * ```tsx
   * form: {
   *   fields: [
   *     { name: 'username', type: 'text', required: true },
   *     { name: 'email', type: 'email', required: true }
   *   ],
   *   defaultValues: { username: '', email: '' },
   *   defaultValueQueryKey: ['getUser'],
   *   defaultValueQueryMap: (userData) => ({
   *     username: userData.username,
   *     email: userData.email
   *   })
   * }
   * ```
   */
  form?: FormPageProps<F, Q>;

  /**
   * Page content items
   *
   * Array of content items (components, containers) or a mapping function
   * that generates content based on current query data and form values.
   *
   * Each content item can declare dependencies (usedQueries, usedFormValues)
   * for selective re-rendering optimization.
   *
   * @optional
   * @since 1.0.0
   * @example Static content
   * ```tsx
   * contents: [
   *   { type: 'custom', component: <Header />, renderInHeader: true },
   *   { type: 'custom', component: <MainContent />, usedQueries: ['getUser'] },
   *   { type: 'container', items: [...], component: CustomContainer }
   * ]
   * ```
   *
   * @example Dynamic content (mapping function)
   * ```tsx
   * contents: (mappedProps) => {
   *   const user = mappedProps.allQuery.getUser?.data;
   *
   *   return [
   *     {
   *       type: 'custom',
   *       component: <Welcome name={user?.name} />,
   *       usedQueries: ['getUser']
   *     }
   *   ];
   * }
   * ```
   */
  contents?: ContentItemsType<F, Q>;

  /**
   * View settings and layout configuration
   *
   * Controls page-level layout including padding, custom containers,
   * header/footer settings, and refresh controls.
   *
   * Can be static object or mapping function for dynamic settings.
   *
   * @optional
   * @since 1.0.0
   * @example Static settings
   * ```tsx
   * viewSettings: {
   *   withoutPadding: false,
   *   header: { withoutPadding: true },
   *   disableRefreshing: false,
   *   customPageContainer: MyCustomContainer
   * }
   * ```
   *
   * @example Dynamic settings
   * ```tsx
   * viewSettings: (mappedProps) => ({
   *   withoutPadding: mappedProps.formValues.compactMode,
   *   disableRefreshing: mappedProps.allQuery.getUser?.isLoading
   * })
   * ```
   */
  viewSettings?: MappedItemsFunction<F, Q, ViewSettings> | ViewSettings;

  /**
   * Metadata configuration for SEO and AI crawlers
   *
   * **NEW in 2.0.0**
   *
   * Defines page metadata including title, description, Open Graph tags,
   * structured data (JSON-LD), and AI crawler hints.
   *
   * Supports static values or dynamic values via mapping functions that
   * update when query data or form values change.
   *
   * @optional
   * @since 2.0.0
   * @example Static metadata
   * ```tsx
   * meta: {
   *   title: 'User Profile',
   *   description: 'Manage your user profile and settings',
   *   keywords: ['profile', 'user', 'settings'],
   *   openGraph: {
   *     type: 'website',
   *     title: 'User Profile',
   *     image: '/og-image.png'
   *   }
   * }
   * ```
   *
   * @example Dynamic metadata
   * ```tsx
   * meta: {
   *   title: (props) => props.allQuery.getUser?.data?.name || 'User Profile',
   *   description: (props) => `Profile for ${props.allQuery.getUser?.data?.name}`,
   *   structuredData: {
   *     type: 'Person',
   *     schema: (props) => ({
   *       '@context': 'https://schema.org',
   *       '@type': 'Person',
   *       name: props.allQuery.getUser?.data?.name
   *     })
   *   }
   * }
   * ```
   */
  meta?: MetadataConfig<F, Q>;

  /**
   * Lazy loading configuration
   *
   * **NEW in 2.0.0**
   *
   * Global lazy loading settings for the page.
   * Individual content items can override with their own `lazy` prop.
   *
   * @optional
   * @since 2.0.0
   * @example
   * ```tsx
   * lazyLoading: {
   *   enabled: true,
   *   suspenseFallback: <LoadingSkeleton />,
   *   intersectionThreshold: 0.1,
   *   intersectionRootMargin: '100px'
   * }
   * ```
   */
  lazyLoading?: LazyLoadingConfig;

  /**
   * Platform-specific configuration overrides
   *
   * **NEW in 2.0.0**
   *
   * Allows different configurations for web vs. React Native platforms.
   * Platform-specific values override base configuration.
   *
   * @optional
   * @since 2.0.0
   * @example
   * ```tsx
   * platformOverrides: {
   *   web: {
   *     meta: { title: 'User Profile - Desktop' },
   *     viewSettings: { withoutPadding: false }
   *   },
   *   native: {
   *     viewSettings: { disableRefreshing: false }
   *   }
   * }
   * ```
   */
  platformOverrides?: PlatformOverrides<F, Q>;

  /**
   * Form values change callback
   *
   * Called whenever form values change.
   * Receives mapped props with current form values, query data, and mutations.
   *
   * Useful for side effects like conditional field visibility,
   * dependent field updates, or analytics tracking.
   *
   * @optional
   * @since 1.0.0
   * @example
   * ```tsx
   * onValuesChange: (mappedProps) => {
   *   if (mappedProps.formValues.country === 'USA') {
   *     mappedProps.setValue('stateRequired', true);
   *   }
   *
   *   // Analytics tracking
   *   analytics.track('formChanged', {
   *     formId: 'user-profile',
   *     values: mappedProps.formValues
   *   });
   * }
   * ```
   */
  onValuesChange?: MappedItemsFunction<F, Q, void>;

  /**
   * Enable authentication control
   *
   * When true, integrates with @gaddario98/react-auth to enforce
   * authentication requirements for this page.
   *
   * @optional
   * @default false
   * @since 1.0.0
   * @example enableAuthControl: true
   */
  enableAuthControl?: boolean;
}

/**
 * Platform-specific configuration overrides
 *
 * **NEW in 2.0.0**
 */
export interface PlatformOverrides<
  F extends FieldValues,
  Q extends QueriesArray
> {
  /**
   * Web-specific overrides (React DOM)
   *
   * These values override base PageProps when running on web platform.
   */
  web?: Partial<PageProps<F, Q>>;

  /**
   * React Native-specific overrides
   *
   * These values override base PageProps when running on React Native.
   */
  native?: Partial<PageProps<F, Q>>;
}

/**
 * Lazy loading configuration
 *
 * **NEW in 2.0.0**
 *
 * Controls global lazy loading behavior for the page.
 */
export interface LazyLoadingConfig {
  /**
   * Enable lazy loading globally for this page
   *
   * @default false
   */
  enabled?: boolean;

  /**
   * Fallback UI shown while lazy components load
   *
   * @default <div>Loading...</div>
   */
  suspenseFallback?: React.ReactNode;

  /**
   * Intersection observer threshold (0.0 to 1.0)
   *
   * 0.0 = trigger as soon as 1 pixel is visible
   * 1.0 = trigger only when fully visible
   *
   * @default 0.1
   */
  intersectionThreshold?: number;

  /**
   * Intersection observer root margin
   *
   * Preload content before it enters viewport.
   * Example: "100px" loads content 100px before visible.
   *
   * @default "0px"
   */
  intersectionRootMargin?: string;
}

/**
 * View settings and layout configuration
 *
 * @since 1.0.0
 */
export interface ViewSettings {
  /**
   * Remove default page padding
   *
   * @default false
   */
  withoutPadding?: boolean;

  /**
   * Header-specific settings
   */
  header?: {
    /**
     * Remove default header padding
     *
     * @default false
     */
    withoutPadding?: boolean;
  };

  /**
   * Footer-specific settings
   */
  footer?: {
    /**
     * Remove default footer padding
     *
     * @default false
     */
    withoutPadding?: boolean;
  };

  /**
   * Disable pull-to-refresh (mobile)
   *
   * @default false
   */
  disableRefreshing?: boolean;

  /**
   * Custom body/content container component
   *
   * Replaces default BodyContainer with custom implementation.
   *
   * @example customLayoutComponent: MyCustomBodyContainer
   */
  customLayoutComponent?: React.ComponentType<any>;

  /**
   * Custom page wrapper/container component
   *
   * Replaces default PageContainer with custom implementation.
   *
   * @example customPageContainer: MyCustomPageContainer
   */
  customPageContainer?: React.ComponentType<any>;
}

/**
 * Type imports from other contracts
 * (These would be defined in their respective files)
 */

// From ContentItems.ts
export type ContentItemsType<
  F extends FieldValues,
  Q extends QueriesArray
> = any; // Placeholder - see ContentItems.ts

// From MappedProps.ts
export type MappedItemsFunction<
  F extends FieldValues,
  Q extends QueriesArray,
  ReturnType
> = any; // Placeholder - see MappedProps.ts

// From Metadata.ts
export type MetadataConfig<
  F extends FieldValues,
  Q extends QueriesArray
> = any; // Placeholder - see Metadata.ts

// From queries (existing in codebase)
export type FormPageProps<
  F extends FieldValues,
  Q extends QueriesArray
> = any; // Placeholder - defined in types.ts

export type QueryPageConfigArray<
  F extends FieldValues,
  Q extends QueriesArray
> = any; // Placeholder - defined in types.ts

/**
 * Backward Compatibility Notes (1.x → 2.x)
 *
 * All existing PageProps fields from 1.x are unchanged:
 * - id (required, unchanged)
 * - ns (optional, unchanged)
 * - queries (optional, unchanged)
 * - form (optional, unchanged)
 * - contents (optional, unchanged)
 * - viewSettings (optional, unchanged)
 * - onValuesChange (optional, unchanged)
 * - enableAuthControl (optional, unchanged)
 *
 * New fields in 2.x (all optional, non-breaking):
 * - meta (NEW in 2.0.0)
 * - lazyLoading (NEW in 2.0.0)
 * - platformOverrides (NEW in 2.0.0)
 *
 * Breaking changes:
 * - None in PageProps interface itself
 * - PageMetadataProps renamed to MetadataConfig (use import alias for compatibility)
 */

/**
 * Migration Example (1.x → 2.x)
 *
 * @example Before (1.x)
 * ```tsx
 * const myPage: PageProps<MyForm, MyQueries> = {
 *   id: 'my-page',
 *   contents: [...],
 *   queries: [...],
 *   form: {...}
 * };
 * ```
 *
 * @example After (2.x) - Same code works!
 * ```tsx
 * const myPage: PageProps<MyForm, MyQueries> = {
 *   id: 'my-page',
 *   contents: [...],
 *   queries: [...],
 *   form: {...}
 * };
 * ```
 *
 * @example After (2.x) - With new features
 * ```tsx
 * const myPage: PageProps<MyForm, MyQueries> = {
 *   id: 'my-page',
 *   contents: [...],
 *   queries: [...],
 *   form: {...},
 *   meta: { title: 'My Page', description: 'Page description' }, // NEW
 *   lazyLoading: { enabled: true }  // NEW
 * };
 * ```
 */
