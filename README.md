# @gaddario98/react-core

A modular, type-safe React framework that unifies state management, forms, data fetching, page orchestration, localization, authentication, and notifications into a single cohesive package. Built on Jotai, TanStack Form, and TanStack Query.

**Version**: 2.1.5 | **License**: MIT | **Author**: Giosuè Addario

---

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Architecture](#architecture)
- [Quick Start — Unified Configuration](#quick-start--unified-configuration)
- [Modules](#modules)
  - [State (`/state`)](#state-state)
  - [Auth (`/auth`)](#auth-auth)
  - [Notifications (`/notifications`)](#notifications-notifications)
  - [Localization (`/localization`)](#localization-localization)
  - [Form (`/form`)](#form-form)
  - [Queries (`/queries`)](#queries-queries)
  - [Pages (`/pages`)](#pages-pages)
  - [Providers (`/providers`)](#providers-providers)
  - [Utilities (`/utiles`)](#utilities-utiles)
  - [Config (`/config`)](#config-config)
- [Entry Points](#entry-points)
- [Cross-Platform Support](#cross-platform-support)
- [TypeScript Support](#typescript-support)
- [Contributing](#contributing)

---

## Overview

`@gaddario98/react-core` is composed of independent modules that share a common state layer (Jotai atoms). Each module can be imported individually via sub-path exports or consumed together through the root entry point.

**Key design principles:**

- **Atom-based state**: Every module stores its configuration and runtime state in Jotai atoms via `atomStateGenerator`, enabling cross-module reactivity without React Context nesting
- **Platform-agnostic**: No DOM or React Native imports — platform behavior is injected via configurable container components
- **Tree-shakeable**: 10 independent sub-path exports; import only what you use
- **Zero-config defaults**: Every module works out of the box with sensible defaults, customizable at any depth
- **TypeScript-first**: Full generic type support with strict inference

---

## Installation

```bash
npm install @gaddario98/react-core
```

### Peer Dependencies

```bash
npm install react@">=18.0.0 <20.0.0"
```

All other dependencies (`@tanstack/react-form`, `@tanstack/react-query`, `jotai`, `axios`, `fast-deep-equal`, `fflate`) are bundled.

---

## Architecture

```
@gaddario98/react-core
├── state/           ← Jotai atom factory + compressed storage
├── auth/            ← Authentication state (built on state/)
├── notifications/   ← Toast/notification state (built on state/)
├── localization/    ← i18n engine with ICU formatting (built on state/)
├── form/            ← Dynamic form builder (built on TanStack Form + state/)
├── queries/         ← Data fetching layer (built on TanStack Query + state/)
├── pages/           ← Page orchestrator (composes form/ + queries/ + state/)
├── providers/       ← Generic provider compositor
├── utiles/          ← Utility functions (classnames, memoization)
└── config/          ← useCoreConfig — unified setup hook
```

The **dependency flow** is bottom-up: `state/` is the foundation, `auth/`, `notifications/`, and `localization/` are state slices, `form/` and `queries/` are feature layers, and `pages/` orchestrates everything. `config/useCoreConfig` wires all modules together in a single hook.

---

## Quick Start — Unified Configuration

The `useCoreConfig` hook initializes all modules at once. Call it near the root of your app:

```tsx
import { useCoreConfig, AppProviders, QueriesProvider } from "@gaddario98/react-core";

function CoreProvider({ children }: { children: React.ReactNode }) {
  useCoreConfig({
    localization: {
      defaultLocale: "en",
      supportedLocales: ["en", "it"],
      locales: {
        en: { common: { welcome: "Welcome" } },
        it: { common: { welcome: "Benvenuto" } },
      },
    },
    pages: {
      PageContainer: ({ children, id }) => <main id={id}>{children}</main>,
      BodyContainer: ({ children }) => <div className="body">{children}</div>,
      defaultMetadata: { title: "My App" },
    },
    form: {
      formFieldContainer: ({ children }) => <div className="field">{children}</div>,
    },
    apiConfig: {
      endpoints: { api: "https://api.example.com" },
    },
  });

  return <>{children}</>;
}

export default function App() {
  return (
    <AppProviders providers={[QueriesProvider]}>
      <CoreProvider>
        {/* your app */}
      </CoreProvider>
    </AppProviders>
  );
}
```

`useCoreConfig` automatically:
- Wires `translateText` from the localization module into forms and pages
- Wires `showNotification` into forms and queries
- Sets the `Authorization` header from `auth.token` on all API requests
- Passes `authValues` into pages for access control

---

## Modules

### State (`/state`)

The foundational layer. Provides a factory function to create Jotai atoms with optional compressed persistence to `localStorage`.

```tsx
import { atomStateGenerator } from "@gaddario98/react-core/state";

const {
  atom: themeAtom,
  useValue: useThemeValue,     // read-only hook
  useState: useThemeState,     // [value, setter] hook
  useReset: useThemeReset,     // reset to default
} = atomStateGenerator<"light" | "dark">({
  key: "app-theme",
  defaultValue: "light",
  persist: true,  // compressed localStorage persistence
});
```

**Storage features:**
- Data < 1 KB stored as raw JSON; larger payloads are deflated (fflate) and base64-encoded
- Writes are debounced (50 ms) and flushed on `beforeunload` / `visibilitychange`
- Swap the storage backend via `setCustomStorage(myStorage)` (e.g., AsyncStorage for React Native)

**Exports:**

| Export | Description |
|---|---|
| `atomStateGenerator<T>(options)` | Creates an atom with `useValue`, `useState`, `useReset` hooks |
| `storage` | Default compressed storage singleton |
| `setCustomStorage(s)` | Replace the storage backend |

---

### Auth (`/auth`)

A persisted authentication state slice.

```tsx
import { useAuthState, useAuthValue } from "@gaddario98/react-core/auth";

// Read auth state
const auth = useAuthValue();
console.log(auth?.token, auth?.isLogged);

// Update auth state
const [auth, setAuth] = useAuthState();
setAuth({ id: "user-1", token: "jwt...", isLogged: true });

// Clear on logout
setAuth(null);
```

**`AuthState` type:**

```ts
type AuthState = {
  id: string;
  accountVerified?: boolean;
  isLogged?: boolean;
  token?: string;
  phoneNumber?: string;
  email?: string;
}
```

The atom is persisted under the key `"reactAuthStore"` using compressed storage.

---

### Notifications (`/notifications`)

In-memory notification state for toast/snackbar systems.

```tsx
import { useNotification } from "@gaddario98/react-core/notifications";

const { showNotification, clearNotification } = useNotification("myPage");

showNotification({
  message: "Profile updated!",
  type: "success",
  autoHideDuration: 3000,
});
```

**`NotificationMessage` type:**

```ts
interface NotificationMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  autoHideDuration?: number;
  textTransOption?: Record<string, unknown>;
  ns?: string;
}
```

**Exports:**

| Export | Description |
|---|---|
| `useNotification(ns?)` | Returns `{ showNotification, clearNotification }` |
| `useNotificationValue()` | Read current notification |
| `useNotificationState()` | `[notification, setter]` tuple |
| `notificationAtom` | Raw Jotai atom |

---

### Localization (`/localization`)

A built-in i18n engine with no external library dependencies. Supports ICU-style interpolation, pluralization, gender selection, and number/date/currency formatting.

```tsx
import { useTranslation, useLocalizationActions } from "@gaddario98/react-core/localization";

// Initialize locales at app startup
const { initializeLocale, switchLocale, addLocale } = useLocalizationActions();

initializeLocale({
  defaultLocale: "en",
  supportedLocales: ["en", "it"],
  locales: {
    en: { shop: { items: "{{count, plural, =0{No items} one{1 item} other{# items}}}" } },
    it: { shop: { items: "{{count, plural, =0{Nessun articolo} one{1 articolo} other{# articoli}}}" } },
  },
});

// Use translations
const { t, locale } = useTranslation("shop");
t("items", { count: 5 }); // "5 items"
```

**Supported interpolation patterns:**
- `{{name}}` — simple variable substitution
- `{{count, number}}` — number formatting (locale-aware)
- `{{date, date}}` — date formatting
- `{{price, currency}}` — currency formatting
- `{{count, plural, =0{...} one{...} other{...}}}` — ICU plural rules
- `{{gender, select, male{...} female{...} other{...}}}` — gender/select

**Server-side usage (outside React):**

```ts
import { createServerTranslator } from "@gaddario98/react-core/localization";

const { t } = createServerTranslator(resources, "en");
t("shop.items", { count: 3 }); // "3 items"
```

---

### Form (`/form`)

A dynamic, type-safe form builder on top of TanStack React Form. Renders fields from a declarative configuration array.

```tsx
import { FormManager } from "@gaddario98/react-core/form";

interface ContactForm {
  name: string;
  email: string;
}

<FormManager<ContactForm>
  defaultValues={{ name: "", email: "" }}
  data={[
    {
      name: "name",
      label: "Full Name",
      rules: { onChange: (val) => (!val ? "Required" : undefined) },
      component: (props) => <input value={props.value} onChange={(e) => props.onChange(e.target.value)} />,
    },
    {
      name: "email",
      label: "Email",
      component: (props) => <input value={props.value} onChange={(e) => props.onChange(e.target.value)} />,
    },
  ]}
  submit={[
    {
      component: ({ onClick }) => <button onClick={onClick}>Save</button>,
      onSuccess: async (values) => console.log(values),
    },
  ]}
/>
```

**Key features:**
- Static or dynamic field definitions (factory functions with `{ get, set }` access to current values)
- Partial form submission — validate only a subset of fields via `values: ["field1", "field2"]`
- Custom layout containers via `viewSettings` (dialogs, cards, drawers)
- Built-in notification integration for success/error feedback
- Headless alternative via `useFormManager` hook

**Global configuration:**

```tsx
import { useFormConfigState } from "@gaddario98/react-core/form";

const [, setFormConfig] = useFormConfigState();
setFormConfig((prev) => ({
  ...prev,
  translateText: (key, opts) => t(key, opts),
  formFieldContainer: MyFieldWrapper,
  showNotification: (msg) => toast(msg.message),
}));
```

For full API details, see [github.com/gaddario98/react-form](https://github.com/gaddario98/react-form).

---

### Queries (`/queries`)

A unified data fetching layer on top of TanStack React Query and Jotai. Manages queries, mutations, and WebSockets through a single declarative API.

```tsx
import { useApi } from "@gaddario98/react-core/queries";
import type { QueriesArray } from "@gaddario98/react-core/queries";

const queries = [
  {
    type: "query",
    key: "products",
    queryConfig: {
      endpoint: ["api", "v1/products"],
      queryKey: ["products"],
    },
  },
  {
    type: "mutation",
    key: "addProduct",
    mutationConfig: {
      endpoint: ["api", "v1/products"],
      method: "POST",
      queryKeyToInvalidate: ["products"],
    },
  },
] as const satisfies QueriesArray;

const { allQuery, allMutation, refreshQueries } = useApi(queries, {
  scopeId: "product-page",
});

const products = allQuery.products.data;
allMutation.addProduct.mutate({ body: { name: "New Product" } });
```

**Key features:**
- Typed `allQuery` / `allMutation` / `allWebSocket` maps from the configuration array
- Automatic Jotai atom sync — query results are accessible cross-component without refetching
- Fine-grained subscriptions via `useApiValues` (re-render only on specific path changes)
- Built-in WebSocket support alongside REST queries
- Payload encryption/decryption (AES-GCM)
- Offline persistence via TanStack Query Persist
- Standalone `useQueryApi` / `useMutateApi` hooks for simpler one-off usage

**Global configuration:**

```tsx
import { useApiConfigState } from "@gaddario98/react-core/queries";

const [, setApiConfig] = useApiConfigState();
setApiConfig({
  endpoints: { api: "https://api.example.com" },
  defaultHeaders: { "Cache-Control": "no-cache" },
  validateAuthFn: () => !!localStorage.getItem("token"),
  queryClient: new QueryClient({ defaultOptions: { queries: { retry: 2 } } }),
});
```

Wrap your app with `QueriesProvider` to initialize the TanStack QueryClient:

```tsx
import { QueriesProvider } from "@gaddario98/react-core/queries";

<QueriesProvider>
  <App />
</QueriesProvider>
```

For full API details, see [github.com/gaddario98/react-queries](https://github.com/gaddario98/react-queries).

---

### Pages (`/pages`)

A page orchestrator that composes forms, queries, metadata, lazy loading, and layout into a single `PageProps` configuration. Works on both web and React Native.

```tsx
import { PageGenerator } from "@gaddario98/react-core/pages";
import type { PageProps, QueryDefinition } from "@gaddario98/react-core/pages";

interface MyForm { search: string }
type MyQueries = [QueryDefinition<"results", "query", never, Product[]>];

const props: PageProps<MyForm, MyQueries> = {
  id: "search-page",
  meta: { title: "Search", description: "Find products" },
  form: {
    defaultValues: { search: "" },
    data: [{ name: "search", debounceDelay: 300, component: SearchInput }],
  },
  queries: [
    {
      type: "query",
      key: "results",
      queryConfig: ({ get }) => ({
        queryKey: ["results", get("form", "search")],
        queryFn: () => fetchProducts(get("form", "search")),
        enabled: get("form", "search", "").length > 2,
      }),
    },
  ],
  contents: [
    {
      type: "custom",
      component: ({ get }) => {
        const results = get("query", "results.data", []);
        return <ProductList products={results} />;
      },
    },
  ],
};

<PageGenerator<MyForm, MyQueries> {...props} />;
```

**Key features:**
- `get()` / `set()` API with automatic dependency tracking (90% fewer re-renders)
- Dynamic SEO metadata (Open Graph, Twitter Card, JSON-LD, AI hints, robots)
- Lazy loading with viewport, interaction, or conditional triggers
- Lifecycle callbacks (`onMountComplete`, `onQuerySuccess`, `onQueryError`, `onFormSubmit`, `onValuesChange`)
- Authentication gate via `enableAuthControl`
- Platform overrides via `platformOverrides: { web: {...}, native: {...} }`

For full API details, see [github.com/gaddario98/react-pages](https://github.com/gaddario98/react-pages).

---

### Providers (`/providers`)

A utility component that composes multiple React providers without deep nesting.

```tsx
import { AppProviders } from "@gaddario98/react-core/providers";

<AppProviders
  providers={[
    QueriesProvider,
    [ThemeProvider, { theme: "dark" }],
    [IntlProvider, { locale: "en" }],
  ]}
>
  <App />
</AppProviders>
```

Supports both bare components and `[Component, props]` tuples. Providers are composed in declaration order (first = outermost).

---

### Utilities (`/utiles`)

General-purpose React and JavaScript utilities.

```tsx
import { cn, withMemo } from "@gaddario98/react-core/utiles";
```

| Export | Description |
|---|---|
| `cn(...inputs)` | Combines `clsx` + `tailwind-merge` for safe Tailwind class merging |
| `withMemo(Component, areEqual?)` | Type-safe `React.memo` wrapper that preserves generic types |
| `createExtractor(data, cache?, keys?)` | Picks a subset of keys from an object with stable reference caching |

---

### Config (`/config`)

The unified configuration hook that wires all modules together.

```tsx
import { useCoreConfig } from "@gaddario98/react-core/config";
```

**`CoreConfig` interface:**

```ts
interface CoreConfig {
  form?: Partial<FormConfigProps>;
  localization?: LocalizationConfigProps;
  pages?: Partial<PageConfigProps>;
  apiConfig?: Partial<ApiConfig>;
}
```

See [Quick Start](#quick-start--unified-configuration) for usage.

**What `useCoreConfig` wires automatically:**

| Source | Target | What |
|---|---|---|
| `localization` | `form`, `pages` | `translateText` function |
| `notifications` | `form`, `queries` | `showNotification` handler |
| `auth` | `queries` | `Authorization` header (Bearer token) |
| `auth` | `queries` | `validateAuthFn` (auth validation) |
| `auth` | `pages` | `authValues` (access control) |

---

## Entry Points

The package exposes 10 sub-path exports for tree-shaking:

| Import Path | Module | Typical Use |
|---|---|---|
| `@gaddario98/react-core` | All modules | Full framework access |
| `@gaddario98/react-core/state` | State | Atom factory, storage |
| `@gaddario98/react-core/auth` | Auth | Authentication state |
| `@gaddario98/react-core/notifications` | Notifications | Toast state |
| `@gaddario98/react-core/localization` | Localization | i18n engine |
| `@gaddario98/react-core/form` | Form | Form builder |
| `@gaddario98/react-core/queries` | Queries | Data fetching |
| `@gaddario98/react-core/pages` | Pages | Page orchestrator |
| `@gaddario98/react-core/providers` | Providers | Provider compositor |
| `@gaddario98/react-core/utiles` | Utilities | Helpers |

---

## Cross-Platform Support

The entire package is platform-agnostic. No module imports `react-dom` or `react-native` directly.

**Web**: Works out of the box. Metadata is written to `document.head`.

**React Native**: Replace the storage backend and layout containers:

```tsx
import { setCustomStorage } from "@gaddario98/react-core/state";
import { usePageConfigState } from "@gaddario98/react-core/pages";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ScrollView } from "react-native";

// Swap storage for React Native
setCustomStorage({
  getItem: (key) => AsyncStorage.getItem(key) ?? null,
  setItem: (key, val) => { AsyncStorage.setItem(key, val) },
  removeItem: (key) => { AsyncStorage.removeItem(key) },
});

// Swap layout containers
const [, setPageConfig] = usePageConfigState();
setPageConfig((prev) => ({
  ...prev,
  PageContainer: ({ children, id }) => <View style={{ flex: 1 }}>{children}</View>,
  BodyContainer: ({ children }) => <ScrollView>{children}</ScrollView>,
  HeaderContainer: ({ children }) => <View>{children}</View>,
  FooterContainer: ({ children }) => <View>{children}</View>,
  ItemsContainer: ({ children }) => <View>{children}</View>,
}));
```

See the [React Native Integration Strategy](https://github.com/gaddario98/react-pages#react-native-integration-strategy) in the pages documentation for a full setup guide.

---

## TypeScript Support

All modules are fully typed with generics. Key generic interfaces:

```ts
// Form — generic over field values
FormManager<F extends FieldValues>
FormManagerProps<F extends FieldValues>

// Queries — generic over query array definition
useApi<Q extends QueriesArray>(queries: Q, options)
QueriesArray  // tuple of query/mutation/websocket definitions

// Pages — generic over form, queries, and page variables
PageGenerator<F extends FieldValues, Q extends QueriesArray, V extends Record<string, unknown>>
PageProps<F, Q, V>
FunctionProps<F, Q, V>  // the { get, set } interface

// State — generic over atom value type
atomStateGenerator<T>(options): AtomState<T>
```

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

- [Open an issue](https://github.com/gaddario98/react-core/issues)
- [Repository](https://github.com/gaddario98/react-core)

---

## License

MIT
