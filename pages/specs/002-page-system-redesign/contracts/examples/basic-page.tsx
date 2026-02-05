/**
 * Example: Basic Page Configuration
 *
 * Demonstrates a simple page with queries, form, and content items.
 * This is the most common use case for the Universal Page System.
 *
 * @example Use case: User profile page with editable fields
 */

import { PageProps } from "../PageProps";
import { QueryDefinition } from "@gaddario98/react-queries";

/**
 * Step 1: Define your form fields type
 */
interface UserProfileForm {
  username: string;
  email: string;
  bio: string;
  age: number;
  country: string;
}

/**
 * Step 2: Define your queries/mutations
 */
type UserProfileQueries = [
  QueryDefinition<"getUser", "query", void, { id: string; name: string; email: string; bio: string; age: number; country: string }, any>,
  QueryDefinition<"updateUser", "mutation", Partial<UserProfileForm>, { success: boolean }, any>
];

/**
 * Step 3: Configure the page
 */
export const basicPageConfig: PageProps<UserProfileForm, UserProfileQueries> = {
  /**
   * Unique page identifier
   */
  id: "user-profile-page",

  /**
   * i18n namespace
   */
  ns: "userProfile",

  /**
   * Query configuration
   * Fetches user data on page load
   */
  queries: [
    {
      type: "query",
      key: "getUser",
      queryConfig: {
        enabled: true, // Auto-fetch on mount
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    },
    {
      type: "mutation",
      key: "updateUser",
      mutationConfig: {
        onSuccess: (data) => {
          console.log("User updated successfully:", data);
          // Invalidate and refetch user query
          // queryClient.invalidateQueries(['getUser']);
        },
        onError: (error: unknown) => {
          console.error("Failed to update user:", error);
        },
      },
    },
  ],

  /**
   * Form configuration
   * Maps query data to form default values
   */
  form: {
    fields: [
      {
        name: "username",
        type: "text",
        label: "Username",
        required: true,
      },
      {
        name: "email",
        type: "email",
        label: "Email",
        required: true,
      },
      {
        name: "bio",
        type: "textarea",
        label: "Bio",
      },
      {
        name: "age",
        type: "number",
        label: "Age",
      },
      {
        name: "country",
        type: "select",
        label: "Country",
        options: [
          { value: "USA", label: "United States" },
          { value: "UK", label: "United Kingdom" },
          { value: "IT", label: "Italy" },
        ],
      },
    ],
    defaultValues: {
      username: "",
      email: "",
      bio: "",
      age: 0,
      country: "",
    },
    // Map query data to form default values
    defaultValueQueryKey: ["getUser"],
    defaultValueQueryMap: (userData) => ({
      username: userData.name,
      email: userData.email,
      bio: userData.bio,
      age: userData.age,
      country: userData.country,
    }),
  },

  /**
   * Page content
   * Static content items array
   */
  contents: [
    // Header section
    {
      type: "custom",
      component: (
        <div>
          <h1>User Profile</h1>
          <p>Edit your profile information below</p>
        </div>
      ),
      renderInHeader: true,
    },

    // User info card (depends on getUser query)
    {
      type: "custom",
      component: (mappedProps) => {
        const user = mappedProps.allQuery.getUser?.data;

        if (mappedProps.allQuery.getUser?.isLoading) {
          return <div>Loading user data...</div>;
        }

        if (mappedProps.allQuery.getUser?.isError) {
          return <div>Failed to load user data</div>;
        }

        return (
          <div className="user-card">
            <h2>Current Profile</h2>
            <p>
              <strong>ID:</strong> {user?.id}
            </p>
            <p>
              <strong>Name:</strong> {user?.name}
            </p>
            <p>
              <strong>Email:</strong> {user?.email}
            </p>
          </div>
        );
      },
      usedQueries: ["getUser"], // Only re-render when getUser updates
      key: "user-info-card",
    },

    // Save button (uses mutation)
    {
      type: "custom",
      component: (mappedProps) => {
        const handleSave = () => {
          mappedProps.allMutation.updateUser.mutate({
            username: mappedProps.formValues.username,
            email: mappedProps.formValues.email,
            bio: mappedProps.formValues.bio,
            age: mappedProps.formValues.age,
            country: mappedProps.formValues.country,
          });
        };

        return (
          <button
            onClick={handleSave}
            disabled={mappedProps.allMutation.updateUser.isLoading}
          >
            {mappedProps.allMutation.updateUser.isLoading
              ? "Saving..."
              : "Save Profile"}
          </button>
        );
      },
      usedFormValues: ["username", "email", "bio", "age", "country"],
      key: "save-button",
    },

    // Footer section
    {
      type: "custom",
      component: <div className="footer">Last updated: {new Date().toLocaleDateString()}</div>,
      renderInFooter: true,
    },
  ],

  /**
   * View settings
   * Static configuration
   */
  viewSettings: {
    withoutPadding: false,
    header: {
      withoutPadding: true,
    },
    disableRefreshing: false,
  },

  /**
   * Metadata for SEO
   */
  meta: {
    title: "User Profile",
    description: "Edit your user profile and settings",
  },

  /**
   * Form change callback
   * Log changes for debugging
   */
  onValuesChange: (mappedProps) => {
    console.log("Form values changed:", mappedProps.formValues);
  },
};

/**
 * Usage in your app:
 *
 * ```tsx
 * import { PageGenerator } from '@gaddario98/react-pages';
 * import { basicPageConfig } from './basic-page';
 *
 * function UserProfilePage() {
 *   return <PageGenerator {...basicPageConfig} />;
 * }
 * ```
 */

/**
 * Key Concepts Demonstrated:
 *
 * 1. Type Safety:
 *    - Form fields type (UserProfileForm)
 *    - Query definitions type (UserProfileQueries)
 *    - Full IntelliSense and compile-time validation
 *
 * 2. Query Integration:
 *    - Auto-fetch on mount (enabled: true)
 *    - Mutation with success/error handlers
 *    - Query invalidation after mutation
 *
 * 3. Form Configuration:
 *    - Field definitions with validation
 *    - Default values from query data
 *    - defaultValueQueryMap for data transformation
 *
 * 4. Content Items:
 *    - Static JSX components
 *    - Dynamic components with mapped props
 *    - Dependency tracking (usedQueries, usedFormValues)
 *    - Slot positioning (renderInHeader, renderInFooter)
 *
 * 5. Performance:
 *    - Explicit dependency declarations
 *    - Selective re-rendering (only affected components)
 *    - Stable keys for content items
 *
 * 6. Metadata:
 *    - Static SEO tags
 *    - Sets document title and description
 */

/**
 * Expected Output:
 *
 * Page structure:
 * ┌─────────────────────────────────────┐
 * │ [HEADER]                           │
 * │ User Profile                       │
 * │ Edit your profile information      │
 * ├─────────────────────────────────────┤
 * │ [CONTENT]                          │
 * │ Current Profile                    │
 * │ ID: 123                            │
 * │ Name: John Doe                     │
 * │ Email: john@example.com            │
 * │                                    │
 * │ [FORM FIELDS]                      │
 * │ Username: [input]                  │
 * │ Email: [input]                     │
 * │ Bio: [textarea]                    │
 * │ Age: [input]                       │
 * │ Country: [select]                  │
 * │                                    │
 * │ [Save Profile button]              │
 * ├─────────────────────────────────────┤
 * │ [FOOTER]                           │
 * │ Last updated: 10/30/2025           │
 * └─────────────────────────────────────┘
 *
 * Performance:
 * - User types in "username" field
 * - Only "save-button" content item re-renders (has usedFormValues: ['username'])
 * - User info card does NOT re-render (no usedFormValues)
 * - Result: 1-2 component re-renders instead of full page re-render
 */
