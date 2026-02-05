/**
 * ContentItems Contract
 *
 * Defines content item types and dependency tracking for the Universal Page System.
 * Content items are the individual renderable units that make up page content.
 *
 * @since 2.0.0
 */

import { FieldValues } from "react-hook-form";
import { QueriesArray } from "@gaddario98/react-queries";
import { MappedItemsFunction } from "./MappedProps";

/**
 * Content Item - Discriminated union of all content types
 *
 * Each content item represents a renderable unit on the page.
 * Items can be custom components or containers of other items.
 *
 * @template F - Form field values type
 * @template Q - Query/mutation definitions array type
 *
 * @since 1.0.0 (enhanced in 2.0.0)
 */
export type ContentItem<
  F extends FieldValues,
  Q extends QueriesArray
> =
  | CustomContentItem<F, Q>
  | ContainerContentItem<F, Q>;

/**
 * Base metadata shared by all content types
 *
 * These fields control dependency tracking, layout, visibility,
 * and performance optimization for content items.
 */
interface ContentItemMetadata<
  F extends FieldValues,
  Q extends QueriesArray
> {
  /**
   * Query dependencies for selective re-rendering
   *
   * Declares which query responses this content item depends on.
   * The system uses this for performance optimization - only re-renders
   * this item when one of these queries updates.
   *
   * @optional
   * @since 1.0.0
   * @example usedQueries: ['getUser', 'getUserPosts']
   * @performance Critical for preventing unnecessary re-renders
   */
  usedQueries?: Array<Q[number]["key"]>;

  /**
   * Form field dependencies for selective re-rendering
   *
   * Declares which form field values this content item depends on.
   * The system uses this for performance optimization - only re-renders
   * this item when one of these fields changes.
   *
   * @optional
   * @since 1.0.0
   * @example usedFormValues: ['username', 'email']
   * @performance Critical for preventing unnecessary re-renders during form input
   */
  usedFormValues?: Array<keyof F>;

  /**
   * Render order index
   *
   * Controls the sort order of content items.
   * Items are sorted by ascending index before rendering.
   *
   * @optional
   * @default undefined (preserves array order)
   * @since 1.0.0
   * @example index: 10
   */
  index?: number;

  /**
   * Grid layout hint
   *
   * Indicates how many grid columns this item should occupy.
   * Interpretation depends on your layout system (e.g., 12-column grid).
   *
   * @optional
   * @default undefined
   * @since 1.0.0
   * @example usedBoxes: 6 // Half width in 12-column grid
   * @example usedBoxes: 12 // Full width
   */
  usedBoxes?: number;

  /**
   * Render in page footer slot
   *
   * When true, this item renders in the page footer section
   * instead of the main content area.
   *
   * @optional
   * @default false
   * @since 1.0.0
   */
  renderInFooter?: boolean;

  /**
   * Render in page header slot
   *
   * When true, this item renders in the page header section
   * instead of the main content area.
   *
   * @optional
   * @default false
   * @since 1.0.0
   */
  renderInHeader?: boolean;

  /**
   * Enable drag-and-drop for this item
   *
   * When true, the item can be dragged and reordered.
   * Requires a drag-and-drop library integration.
   *
   * @optional
   * @default false
   * @since 1.0.0
   */
  isDraggable?: boolean;

  /**
   * Context flag: parent is draggable
   *
   * Indicates whether this item's parent container supports drag-and-drop.
   * Used for styling and interaction hints.
   *
   * @optional
   * @default false
   * @since 1.0.0
   */
  isInDraggableView?: boolean;

  /**
   * Conditional visibility
   *
   * When true, the item is not rendered.
   * Can be used with mapping functions for dynamic visibility.
   *
   * @optional
   * @default false
   * @since 1.0.0
   * @example hidden: formValues.advancedMode === false
   */
  hidden?: boolean;

  /**
   * React key override
   *
   * Overrides the default React key (which is index-based).
   * Use this for stable keys when items can be reordered or filtered.
   *
   * @optional
   * @default `content-${index}`
   * @since 1.0.0
   * @example key: 'user-profile-card'
   */
  key?: string;

  /**
   * Enable lazy loading for this item
   *
   * **NEW in 2.0.0**
   *
   * When true, this content item is code-split and loaded on demand.
   * Uses React.lazy() and Suspense for code splitting.
   *
   * @optional
   * @default false
   * @since 2.0.0
   * @performance Can reduce initial bundle size by 30-40%
   * @constraint Cannot be combined with renderInHeader: true
   */
  lazy?: boolean;

  /**
   * Lazy loading trigger type
   *
   * **NEW in 2.0.0**
   *
   * Controls when the lazy content loads.
   * - "viewport": Load when entering viewport (IntersectionObserver)
   * - "interaction": Load on user interaction (click, hover)
   * - "conditional": Load when a condition becomes true
   *
   * @optional
   * @default "viewport"
   * @since 2.0.0
   * @requires lazy: true
   */
  lazyTrigger?: "viewport" | "interaction" | "conditional";

  /**
   * Lazy loading condition
   *
   * **NEW in 2.0.0**
   *
   * When lazyTrigger is "conditional", this function determines
   * when to load the lazy content.
   *
   * @optional
   * @since 2.0.0
   * @requires lazyTrigger: "conditional"
   * @example lazyCondition: (props) => props.formValues.showAdvanced === true
   */
  lazyCondition?: MappedItemsFunction<F, Q, boolean>;
}

/**
 * Custom Component Item
 *
 * Renders a custom React component or element.
 * The component can be static JSX or a function receiving mapped props.
 */
export interface CustomContentItem<
  F extends FieldValues,
  Q extends QueriesArray
> extends ContentItemMetadata<F, Q> {
  /**
   * Discriminator for type narrowing
   */
  type: "custom";

  /**
   * Component to render
   *
   * Can be:
   * 1. Static JSX element: `<MyComponent />`
   * 2. Mapping function: `(props) => <MyComponent data={props.allQuery.getData} />`
   *
   * Mapping functions receive MappedProps with current form values,
   * query data, and mutation functions.
   *
   * @example Static component
   * ```tsx
   * {
   *   type: 'custom',
   *   component: <WelcomeMessage />
   * }
   * ```
   *
   * @example Dynamic component with mapped props
   * ```tsx
   * {
   *   type: 'custom',
   *   component: (mappedProps) => (
   *     <UserProfile
   *       user={mappedProps.allQuery.getUser?.data}
   *       onUpdate={mappedProps.allMutation.updateUser}
   *     />
   *   ),
   *   usedQueries: ['getUser']
   * }
   * ```
   */
  component:
    | React.JSX.Element
    | MappedItemsFunction<F, Q, React.JSX.Element>;
}

/**
 * Container Item
 *
 * A container that holds other content items (recursive structure).
 * Useful for grouping related content with shared layout or styling.
 */
export interface ContainerContentItem<
  F extends FieldValues,
  Q extends QueriesArray
> extends ContentItemMetadata<F, Q> {
  /**
   * Discriminator for type narrowing
   */
  type: "container";

  /**
   * Nested content items
   *
   * Can be an array of content items or a mapping function that
   * generates content items dynamically.
   *
   * Supports recursive nesting (containers can contain containers).
   *
   * @example Static nested items
   * ```tsx
   * {
   *   type: 'container',
   *   items: [
   *     { type: 'custom', component: <Header /> },
   *     { type: 'custom', component: <Body /> }
   *   ]
   * }
   * ```
   *
   * @example Dynamic nested items
   * ```tsx
   * {
   *   type: 'container',
   *   items: (mappedProps) => {
   *     const posts = mappedProps.allQuery.getPosts?.data || [];
   *     return posts.map(post => ({
   *       type: 'custom',
   *       component: <PostCard post={post} />,
   *       key: post.id
   *     }));
   *   },
   *   usedQueries: ['getPosts']
   * }
   * ```
   */
  items: ContentItemsType<F, Q>;

  /**
   * Custom container component
   *
   * Overrides the default ItemsContainer component.
   * Receives nested items as children.
   *
   * @optional
   * @default pageConfig.ItemsContainer
   * @example component: MyCustomContainer
   */
  component?: React.ComponentType<any>;
}

/**
 * Content Items Type
 *
 * Top-level type for page contents.
 * Can be a static array or a dynamic mapping function.
 *
 * @example Static content
 * ```tsx
 * contents: [
 *   { type: 'custom', component: <Header />, renderInHeader: true },
 *   { type: 'custom', component: <MainContent /> },
 *   { type: 'custom', component: <Footer />, renderInFooter: true }
 * ]
 * ```
 *
 * @example Dynamic content based on query data
 * ```tsx
 * contents: (mappedProps) => {
 *   const user = mappedProps.allQuery.getUser?.data;
 *   const isAdmin = user?.role === 'admin';
 *
 *   return [
 *     { type: 'custom', component: <UserInfo user={user} />, usedQueries: ['getUser'] },
 *     ...(isAdmin ? [{ type: 'custom', component: <AdminPanel /> }] : [])
 *   ];
 * }
 * ```
 */
export type ContentItemsType<
  F extends FieldValues,
  Q extends QueriesArray
> =
  | ContentItem<F, Q>[]
  | MappedItemsFunction<F, Q, ContentItem<F, Q>[]>;

/**
 * Dependency Tracking Best Practices
 *
 * 1. **Always declare usedQueries**:
 *    If your component uses query data, declare it in usedQueries.
 *    This enables selective re-rendering and prevents unnecessary updates.
 *
 * 2. **Always declare usedFormValues**:
 *    If your component uses form values, declare them in usedFormValues.
 *    This is especially important for forms with many fields.
 *
 * 3. **Be precise, not broad**:
 *    Only declare the exact queries/fields you use, not all available data.
 *    Example: usedFormValues: ['username'] not usedFormValues: Object.keys(formValues)
 *
 * 4. **Use keys for dynamic lists**:
 *    When generating items in a mapping function, always provide stable keys.
 *    Example: key: item.id not key: `item-${index}`
 *
 * 5. **Avoid circular dependencies**:
 *    Don't create items where A depends on B, B depends on C, and C depends on A.
 *    The system detects and warns about these, but they can cause unexpected behavior.
 *
 * @example Good dependency tracking
 * ```tsx
 * {
 *   type: 'custom',
 *   component: (props) => (
 *     <UserStats
 *       stats={props.allQuery.getUserStats?.data}
 *       username={props.formValues.username}
 *     />
 *   ),
 *   usedQueries: ['getUserStats'],      // Only getUserStats, not all queries
 *   usedFormValues: ['username'],        // Only username, not all form fields
 *   key: 'user-stats'                    // Stable key
 * }
 * ```
 *
 * @example Bad dependency tracking
 * ```tsx
 * {
 *   type: 'custom',
 *   component: (props) => <UserStats {...props} />,
 *   // Missing usedQueries and usedFormValues!
 *   // This will re-render on EVERY query or form change.
 * }
 * ```
 */

/**
 * Performance Impact of Dependency Tracking
 *
 * **Without dependency tracking**:
 * - Page with 20 content items, user types in one form field
 * - Result: All 20 items re-render (100% re-render rate)
 * - Frame time: ~40ms (dropped frames, janky UI)
 *
 * **With dependency tracking**:
 * - Same page, same form field change
 * - Result: Only items with usedFormValues: ['thatField'] re-render (maybe 2-3 items)
 * - Frame time: ~5ms (smooth 60 FPS)
 *
 * Success criteria (SC-004): Max 3 component re-renders per state change.
 * Dependency tracking is critical for achieving this goal.
 */

/**
 * Lazy Loading Guidelines
 *
 * **When to use lazy loading**:
 * - Below-the-fold content (not visible on initial load)
 * - Conditionally shown content (tabs, modals, accordions)
 * - Heavy components (charts, data tables, editors)
 * - Optional features (admin panels, advanced settings)
 *
 * **When NOT to use lazy loading**:
 * - Above-the-fold content (visible immediately)
 * - Header/footer content (renderInHeader/renderInFooter: true)
 * - Critical content for SEO
 * - Small components (<5 KB)
 *
 * @example Lazy loading a modal
 * ```tsx
 * {
 *   type: 'custom',
 *   component: (props) => <UserSettingsModal />,
 *   lazy: true,
 *   lazyTrigger: 'conditional',
 *   lazyCondition: (props) => props.formValues.showSettings === true,
 *   usedFormValues: ['showSettings']
 * }
 * ```
 *
 * @example Lazy loading below-the-fold content
 * ```tsx
 * {
 *   type: 'custom',
 *   component: <HeavyDataTable />,
 *   lazy: true,
 *   lazyTrigger: 'viewport',  // Load when scrolling into view
 *   index: 100  // Render after other content
 * }
 * ```
 */

/**
 * Migration Notes (1.x → 2.x)
 *
 * **Backward compatible changes**:
 * - All existing fields work as before
 * - usedQueries, usedFormValues, index, usedBoxes, etc. unchanged
 *
 * **New fields (non-breaking)**:
 * - lazy (default: false)
 * - lazyTrigger (default: "viewport")
 * - lazyCondition (optional)
 *
 * **Recommended upgrades**:
 * 1. Add dependency tracking to all content items for better performance
 * 2. Mark below-the-fold content as lazy: true
 * 3. Use stable keys for dynamic lists
 *
 * @example Before (1.x)
 * ```tsx
 * contents: [
 *   { type: 'custom', component: <HeavyTable /> }
 * ]
 * ```
 *
 * @example After (2.x) - with optimizations
 * ```tsx
 * contents: [
 *   {
 *     type: 'custom',
 *     component: <HeavyTable />,
 *     lazy: true,              // NEW: Code splitting
 *     lazyTrigger: 'viewport', // NEW: Load on scroll
 *     usedQueries: ['getData'],// RECOMMENDED: Dependency tracking
 *     key: 'data-table'        // RECOMMENDED: Stable key
 *   }
 * ]
 * ```
 */
