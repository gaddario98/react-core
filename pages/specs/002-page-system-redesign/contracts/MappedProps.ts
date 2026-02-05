/**
 * MappedProps Contract
 *
 * Defines the runtime context passed to all mapping functions and custom components.
 * This is the "dynamic configuration" layer that enables reactive, data-driven page behavior.
 *
 * @since 1.0.0 (enhanced documentation in 2.0.0)
 */

import { FieldValues, UseFormSetValue } from "react-hook-form";
import {
  QueriesArray,
  MultipleQueryResponse,
  AllMutation,
} from "@gaddario98/react-queries";

/**
 * Mapped Props - Runtime context for dynamic configuration
 *
 * This object is passed to all mapping functions throughout the PageProps configuration:
 * - contents: (mappedProps) => ContentItem[]
 * - viewSettings: (mappedProps) => ViewSettings
 * - onValuesChange: (mappedProps) => void
 * - meta.title: (mappedProps) => string
 * - ... and many more
 *
 * It provides access to:
 * 1. Current form state (values and setValue function)
 * 2. All query responses (data, loading states, errors)
 * 3. All mutation functions
 *
 * This enables reactive, data-driven page configuration that updates
 * automatically when queries load or form values change.
 *
 * @template F - Form field values type (extends React Hook Form's FieldValues)
 * @template Q - Query/mutation definitions array type
 *
 * @example Basic usage
 * ```tsx
 * const pageConfig: PageProps<MyForm, MyQueries> = {
 *   contents: (mappedProps) => {
 *     // Access query data
 *     const user = mappedProps.allQuery.getUser?.data;
 *
 *     // Access form values
 *     const username = mappedProps.formValues.username;
 *
 *     // Use mutations
 *     const handleUpdate = () => {
 *       mappedProps.allMutation.updateUser({ name: username });
 *     };
 *
 *     return [
 *       { type: 'custom', component: <UserCard user={user} onUpdate={handleUpdate} /> }
 *     ];
 *   }
 * };
 * ```
 */
export interface MappedProps<
  F extends FieldValues,
  Q extends QueriesArray
> {
  /**
   * Current form values
   *
   * Contains all form field values in their current state.
   * Type-safe access to all fields defined in your form schema.
   *
   * **Reactivity**: Updates whenever any form field changes.
   * **Performance**: Use `usedFormValues` in content items to prevent
   * unnecessary re-renders when fields your component doesn't use change.
   *
   * @example
   * ```tsx
   * // Access form values
   * const username = mappedProps.formValues.username;
   * const email = mappedProps.formValues.email;
   * const age = mappedProps.formValues.age;
   *
   * // Conditional logic based on form values
   * if (mappedProps.formValues.agreeToTerms) {
   *   // Show terms-dependent content
   * }
   * ```
   */
  formValues: F;

  /**
   * Function to update individual form fields
   *
   * Updates a specific form field value programmatically.
   * Useful for computed fields, cascading updates, or side effects.
   *
   * **Type safety**: Field names and values are type-checked against
   * your form schema (F type parameter).
   *
   * @example
   * ```tsx
   * // Update a single field
   * mappedProps.setValue('username', 'newUsername');
   *
   * // Conditional field updates (onValuesChange callback)
   * onValuesChange: (mappedProps) => {
   *   if (mappedProps.formValues.country === 'USA') {
   *     mappedProps.setValue('stateRequired', true);
   *   }
   * }
   *
   * // Computed fields
   * onValuesChange: (mappedProps) => {
   *   const { firstName, lastName } = mappedProps.formValues;
   *   mappedProps.setValue('fullName', `${firstName} ${lastName}`);
   * }
   * ```
   */
  setValue: UseFormSetValue<F>;

  /**
   * All query responses
   *
   * Object containing responses for all queries defined in PageProps.queries.
   * Each query is keyed by its `key` field.
   *
   * **Query Response Structure** (from TanStack Query):
   * ```typescript
   * {
   *   data: T | undefined;        // Query response data
   *   error: Error | null;        // Error if query failed
   *   isLoading: boolean;         // Initial loading state
   *   isFetching: boolean;        // Loading or refetching
   *   isSuccess: boolean;         // Query succeeded
   *   isError: boolean;           // Query failed
   *   refetch: () => void;        // Manually refetch
   *   // ... more TanStack Query properties
   * }
   * ```
   *
   * **Reactivity**: Updates whenever any query state changes (data, loading, error).
   * **Performance**: Use `usedQueries` in content items to prevent unnecessary
   * re-renders when queries your component doesn't use change.
   *
   * @example
   * ```tsx
   * // Access query data
   * const user = mappedProps.allQuery.getUser?.data;
   * const posts = mappedProps.allQuery.getUserPosts?.data || [];
   *
   * // Check loading states
   * if (mappedProps.allQuery.getUser?.isLoading) {
   *   return [{ type: 'custom', component: <LoadingSpinner /> }];
   * }
   *
   * // Handle errors
   * if (mappedProps.allQuery.getUser?.isError) {
   *   return [{ type: 'custom', component: <ErrorMessage /> }];
   * }
   *
   * // Use data in content
   * return [
   *   {
   *     type: 'custom',
   *     component: <UserProfile user={user} posts={posts} />,
   *     usedQueries: ['getUser', 'getUserPosts']
   *   }
   * ];
   * ```
   */
  allQuery: MultipleQueryResponse<Q>;

  /**
   * All mutation functions
   *
   * Object containing mutation functions for all mutations defined in PageProps.queries.
   * Each mutation is keyed by its `key` field.
   *
   * **Mutation Function Signature**:
   * ```typescript
   * (variables: MutationVariables) => Promise<MutationResponse>
   * ```
   *
   * **Mutation Response** (from TanStack Query):
   * ```typescript
   * {
   *   mutate: (variables) => void;           // Fire-and-forget mutation
   *   mutateAsync: (variables) => Promise;   // Async mutation with promise
   *   isLoading: boolean;                    // Mutation in progress
   *   isSuccess: boolean;                    // Mutation succeeded
   *   isError: boolean;                      // Mutation failed
   *   error: Error | null;                   // Error if mutation failed
   *   data: T | undefined;                   // Mutation response data
   *   reset: () => void;                     // Reset mutation state
   * }
   * ```
   *
   * **Best Practice**: Use mutations in event handlers, not directly in render.
   *
   * @example
   * ```tsx
   * // Use mutation in button click handler
   * contents: (mappedProps) => {
   *   const handleUpdate = () => {
   *     mappedProps.allMutation.updateUser.mutate({
   *       id: mappedProps.formValues.userId,
   *       name: mappedProps.formValues.username
   *     });
   *   };
   *
   *   return [
   *     {
   *       type: 'custom',
   *       component: <UpdateButton onClick={handleUpdate} />
   *     }
   *   ];
   * }
   *
   * // Async mutation with error handling
   * contents: (mappedProps) => {
   *   const handleSave = async () => {
   *     try {
   *       await mappedProps.allMutation.saveData.mutateAsync({
   *         data: mappedProps.formValues
   *       });
   *       alert('Saved successfully!');
   *     } catch (error) {
   *       alert('Save failed: ' + error.message);
   *     }
   *   };
   *
   *   return [
   *     {
   *       type: 'custom',
   *       component: <SaveButton onClick={handleSave} />
   *     }
   *   ];
   * }
   * ```
   */
  allMutation: AllMutation<Q>;
}

/**
 * Mapping Function Type
 *
 * Generic type for all mapping functions in the page system.
 * A mapping function receives MappedProps and returns a configuration value.
 *
 * Used throughout PageProps for dynamic configuration:
 * - contents: MappedItemsFunction<F, Q, ContentItem[]>
 * - viewSettings: MappedItemsFunction<F, Q, ViewSettings>
 * - meta.title: MappedItemsFunction<F, Q, string>
 * - ... and more
 *
 * @template F - Form field values type
 * @template Q - Query/mutation definitions array type
 * @template ReturnType - The type of value this function returns
 *
 * @example String mapping function (for meta.title)
 * ```tsx
 * const titleMapper: MappedItemsFunction<MyForm, MyQueries, string> = (props) => {
 *   const user = props.allQuery.getUser?.data;
 *   return user ? `${user.name}'s Profile` : 'User Profile';
 * };
 *
 * // Usage in PageProps
 * meta: {
 *   title: titleMapper
 * }
 * ```
 *
 * @example Array mapping function (for contents)
 * ```tsx
 * const contentsMapper: MappedItemsFunction<MyForm, MyQueries, ContentItem[]> = (props) => {
 *   const posts = props.allQuery.getPosts?.data || [];
 *
 *   return posts.map(post => ({
 *     type: 'custom',
 *     component: <PostCard post={post} />,
 *     key: post.id
 *   }));
 * };
 *
 * // Usage in PageProps
 * contents: contentsMapper
 * ```
 *
 * @example Object mapping function (for viewSettings)
 * ```tsx
 * const settingsMapper: MappedItemsFunction<MyForm, MyQueries, ViewSettings> = (props) => {
 *   return {
 *     withoutPadding: props.formValues.compactMode,
 *     disableRefreshing: props.allQuery.getData?.isLoading
 *   };
 * };
 *
 * // Usage in PageProps
 * viewSettings: settingsMapper
 * ```
 */
export type MappedItemsFunction<
  F extends FieldValues,
  Q extends QueriesArray,
  ReturnType
> = (props: MappedProps<F, Q>) => ReturnType;

/**
 * Memoization Best Practices
 *
 * **Critical for Performance**: MappedProps must be stable across renders
 * to prevent unnecessary re-renders of components receiving mapped props.
 *
 * **Implementation Pattern** (in PageGenerator):
 * ```typescript
 * const mappedProps = useMemo<MappedProps<F, Q>>(
 *   () => ({
 *     formValues,    // Already stable from React Hook Form
 *     setValue,      // Already stable from React Hook Form
 *     allQuery,      // Memoized by usePageQueries
 *     allMutation,   // Memoized by usePageQueries
 *   }),
 *   [formValues, setValue, allQuery, allMutation]
 * );
 * ```
 *
 * **Why this matters**:
 * - Without memoization: New MappedProps object on every render → All mapping functions re-run → All content re-renders
 * - With memoization: Same MappedProps object across renders → Mapping functions only run when dependencies change → Minimal re-renders
 *
 * **Performance Target** (SC-004): Max 3 component re-renders per state change.
 * Stable MappedProps is critical for achieving this.
 */

/**
 * Type Safety Guarantees
 *
 * **Form Values Type Safety**:
 * ```typescript
 * interface MyFormFields {
 *   username: string;
 *   age: number;
 * }
 *
 * // TypeScript ensures type safety
 * mappedProps.formValues.username; // ✅ Type: string
 * mappedProps.formValues.age;      // ✅ Type: number
 * mappedProps.formValues.invalid;  // ❌ Compile error: Property doesn't exist
 *
 * mappedProps.setValue('username', 'newName'); // ✅ Correct
 * mappedProps.setValue('age', 'invalid');      // ❌ Compile error: Type 'string' not assignable to 'number'
 * ```
 *
 * **Query Response Type Safety**:
 * ```typescript
 * type MyQueries = [
 *   QueryDefinition<'getUser', 'query', void, User, any>,
 *   QueryDefinition<'getPosts', 'query', void, Post[], any>
 * ];
 *
 * // TypeScript infers correct types
 * mappedProps.allQuery.getUser?.data;  // ✅ Type: User | undefined
 * mappedProps.allQuery.getPosts?.data; // ✅ Type: Post[] | undefined
 * mappedProps.allQuery.invalid?.data;  // ❌ Compile error: Property doesn't exist
 * ```
 *
 * **Mutation Type Safety**:
 * ```typescript
 * type MyQueries = [
 *   QueryDefinition<'updateUser', 'mutation', UpdateUserInput, User, any>
 * ];
 *
 * // TypeScript enforces correct mutation variables
 * mappedProps.allMutation.updateUser.mutate({ name: 'John' }); // ✅ Correct
 * mappedProps.allMutation.updateUser.mutate({ invalid: true }); // ❌ Compile error
 * ```
 */

/**
 * Common Usage Patterns
 */

/**
 * Pattern 1: Conditional Content Based on Query Data
 *
 * @example
 * ```tsx
 * contents: (mappedProps) => {
 *   const user = mappedProps.allQuery.getUser?.data;
 *
 *   // Show loading state
 *   if (mappedProps.allQuery.getUser?.isLoading) {
 *     return [{ type: 'custom', component: <LoadingSpinner /> }];
 *   }
 *
 *   // Show error state
 *   if (mappedProps.allQuery.getUser?.isError) {
 *     return [{ type: 'custom', component: <ErrorMessage /> }];
 *   }
 *
 *   // Show content based on user role
 *   return [
 *     { type: 'custom', component: <UserInfo user={user} />, usedQueries: ['getUser'] },
 *     ...(user?.role === 'admin'
 *       ? [{ type: 'custom', component: <AdminPanel /> }]
 *       : []
 *     )
 *   ];
 * }
 * ```
 */

/**
 * Pattern 2: Form-Driven Content Visibility
 *
 * @example
 * ```tsx
 * contents: (mappedProps) => {
 *   const showAdvanced = mappedProps.formValues.advancedMode;
 *
 *   return [
 *     { type: 'custom', component: <BasicSettings /> },
 *     {
 *       type: 'custom',
 *       component: <AdvancedSettings />,
 *       hidden: !showAdvanced,
 *       usedFormValues: ['advancedMode']
 *     }
 *   ];
 * }
 * ```
 */

/**
 * Pattern 3: Cascading Form Field Updates
 *
 * @example
 * ```tsx
 * onValuesChange: (mappedProps) => {
 *   // Update state field when country changes
 *   if (mappedProps.formValues.country !== 'USA') {
 *     mappedProps.setValue('state', '');
 *     mappedProps.setValue('stateRequired', false);
 *   } else {
 *     mappedProps.setValue('stateRequired', true);
 *   }
 *
 *   // Compute full name from first and last name
 *   const { firstName, lastName } = mappedProps.formValues;
 *   if (firstName || lastName) {
 *     mappedProps.setValue('fullName', `${firstName || ''} ${lastName || ''}`.trim());
 *   }
 * }
 * ```
 */

/**
 * Pattern 4: Dynamic Metadata from Query Data
 *
 * @example
 * ```tsx
 * meta: {
 *   title: (mappedProps) => {
 *     const product = mappedProps.allQuery.getProduct?.data;
 *     return product ? `${product.name} - Product Details` : 'Product Details';
 *   },
 *   description: (mappedProps) => {
 *     const product = mappedProps.allQuery.getProduct?.data;
 *     return product?.description || 'View product details and pricing';
 *   },
 *   openGraph: {
 *     image: (mappedProps) => mappedProps.allQuery.getProduct?.data?.imageUrl || '/default-og.png'
 *   }
 * }
 * ```
 */

/**
 * Pattern 5: Mutation Handling with Form Values
 *
 * @example
 * ```tsx
 * contents: (mappedProps) => {
 *   const handleSubmit = async () => {
 *     try {
 *       await mappedProps.allMutation.saveUser.mutateAsync({
 *         id: mappedProps.formValues.userId,
 *         name: mappedProps.formValues.username,
 *         email: mappedProps.formValues.email
 *       });
 *       alert('User saved successfully!');
 *     } catch (error) {
 *       alert('Failed to save user: ' + error.message);
 *     }
 *   };
 *
 *   return [
 *     {
 *       type: 'custom',
 *       component: (
 *         <button onClick={handleSubmit}>
 *           {mappedProps.allMutation.saveUser.isLoading ? 'Saving...' : 'Save'}
 *         </button>
 *       )
 *     }
 *   ];
 * }
 * ```
 */

/**
 * Anti-Patterns (What NOT to Do)
 */

/**
 * ❌ Anti-Pattern 1: Creating new objects/arrays in render
 *
 * @example BAD
 * ```tsx
 * contents: (mappedProps) => {
 *   // ❌ New array created on every render
 *   const userData = {
 *     name: mappedProps.formValues.username,
 *     email: mappedProps.formValues.email
 *   };
 *
 *   return [
 *     { type: 'custom', component: <UserCard user={userData} /> }
 *     // This will cause UserCard to re-render even if username/email didn't change!
 *   ];
 * }
 * ```
 *
 * @example GOOD
 * ```tsx
 * contents: (mappedProps) => {
 *   // ✅ Pass primitive values or use memoization
 *   return [
 *     {
 *       type: 'custom',
 *       component: (
 *         <UserCard
 *           name={mappedProps.formValues.username}
 *           email={mappedProps.formValues.email}
 *         />
 *       ),
 *       usedFormValues: ['username', 'email']
 *     }
 *   ];
 * }
 * ```
 */

/**
 * ❌ Anti-Pattern 2: Calling mutations directly in render
 *
 * @example BAD
 * ```tsx
 * contents: (mappedProps) => {
 *   // ❌ Mutation called on every render!
 *   mappedProps.allMutation.updateUser.mutate({ ... });
 *
 *   return [{ type: 'custom', component: <div>Content</div> }];
 * }
 * ```
 *
 * @example GOOD
 * ```tsx
 * contents: (mappedProps) => {
 *   // ✅ Mutation called in event handler
 *   const handleUpdate = () => {
 *     mappedProps.allMutation.updateUser.mutate({ ... });
 *   };
 *
 *   return [
 *     { type: 'custom', component: <button onClick={handleUpdate}>Update</button> }
 *   ];
 * }
 * ```
 */

/**
 * ❌ Anti-Pattern 3: Missing dependency declarations
 *
 * @example BAD
 * ```tsx
 * contents: (mappedProps) => {
 *   const user = mappedProps.allQuery.getUser?.data;
 *
 *   return [
 *     {
 *       type: 'custom',
 *       component: <UserCard user={user} />
 *       // ❌ Missing usedQueries: ['getUser']
 *       // This will re-render on ALL query changes!
 *     }
 *   ];
 * }
 * ```
 *
 * @example GOOD
 * ```tsx
 * contents: (mappedProps) => {
 *   const user = mappedProps.allQuery.getUser?.data;
 *
 *   return [
 *     {
 *       type: 'custom',
 *       component: <UserCard user={user} />,
 *       usedQueries: ['getUser']  // ✅ Explicit dependency
 *     }
 *   ];
 * }
 * ```
 */

/**
 * Migration Notes (1.x → 2.x)
 *
 * **No breaking changes**: MappedProps interface is identical in 1.x and 2.x.
 *
 * **Documentation improvements**: 2.0.0 adds comprehensive examples and best practices.
 *
 * **Recommended upgrades**:
 * - Review your mapping functions for anti-patterns
 * - Add explicit dependency tracking (usedQueries, usedFormValues)
 * - Use React DevTools Profiler to verify minimal re-renders
 */
