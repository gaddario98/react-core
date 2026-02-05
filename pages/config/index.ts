import { atomStateGenerator } from '@gaddario98/react-state'
import { getMetadata, resetMetadata, setMetadata } from './metadata'
import type { ContentItem, PageProps, ViewSettings } from '../types'
import type { LazyLoadingConfig, MetadataConfig } from './types'
import type { QueriesArray } from '@gaddario98/react-queries'
import type { FieldValues, FormManagerConfig, Submit } from '@gaddario98/react-form'
import type { AuthState } from '@gaddario98/react-auth'

export interface DefaultContainerProps<
  F extends FieldValues = FieldValues,
  Q extends QueriesArray = QueriesArray,
  V extends Record<string, unknown> = Record<string, unknown>,
> {
  children?: Array<React.JSX.Element>
  allContents: Array<ContentItem<F, Q, V> | FormManagerConfig<F> | Submit<F>>
  handleRefresh?: () => void
  viewSettings?: ViewSettings
  pageId?: string
}
export type PageAuthState = {
  id: string
  accountVerified?: boolean
  isLogged?: boolean
  token?: string
  phoneNumber?: string
  email?: string
}
export interface PageTranslationOptions {
  [key: string]: string | number | boolean | undefined
  ns?: string
}
export interface PageConfigProps {
  HeaderContainer: <
    F extends FieldValues = FieldValues,
    Q extends QueriesArray = QueriesArray,
    V extends Record<string, unknown> = Record<string, unknown>,
  >(
    props: Omit<DefaultContainerProps<F, Q, V>, 'viewSettings'> &
      ViewSettings['header'],
  ) => React.ReactNode
  FooterContainer: <
    F extends FieldValues = FieldValues,
    Q extends QueriesArray = QueriesArray,
    V extends Record<string, unknown> = Record<string, unknown>,
  >(
    props: Omit<DefaultContainerProps<F, Q, V>, 'viewSettings'> &
      ViewSettings['footer'],
  ) => React.ReactNode
  BodyContainer: <
    F extends FieldValues = FieldValues,
    Q extends QueriesArray = QueriesArray,
    V extends Record<string, unknown> = Record<string, unknown>,
  >(
    props: DefaultContainerProps<F, Q, V>,
  ) => React.ReactNode
  authPageImage: string
  authPageProps: PageProps
  isLogged: (val: AuthState | null) => boolean
  ItemsContainer: (props: { children: React.ReactNode }) => React.ReactNode
  LoaderComponent?: (props: {
    loading?: boolean
    message?: string
    ns?: string
  }) => React.ReactNode
  PageContainer: (props: {
    children: React.ReactNode
    id: string
  }) => React.ReactNode
  meta?: {
    title?: string
    description?: string
  }
  // Metadata configuration
  defaultMetadata: MetadataConfig
  setMetadata: (config: MetadataConfig) => void
  getMetadata: () => MetadataConfig
  resetMetadata: () => void
  // Lazy loading configuration
  lazyLoading: LazyLoadingConfig
  authValues?: PageAuthState | null
  locale?: string
  translateText?: (key: string, options?: PageTranslationOptions) => string
}

const DefaultContainer = <
  F extends FieldValues = FieldValues,
  Q extends QueriesArray = QueriesArray,
  V extends Record<string, unknown> = Record<string, unknown>,
>({
  children,
}: DefaultContainerProps<F, Q, V>) => {
  return children
}

// Lazy initialization to avoid side effects at module load time
// This ensures tree-shaking works correctly by deferring singleton creation
let _pageConfig: PageConfigProps = {
  HeaderContainer: DefaultContainer,
  FooterContainer: DefaultContainer,
  BodyContainer: DefaultContainer,
  authPageImage: '',
  authPageProps: { id: 'auth-page' },
  isLogged: (val: AuthState | null) => !!val?.id && !!val.isLogged,
  ItemsContainer: ({ children }) => children,
  PageContainer: ({ children }) => children,
  meta: {
    title: '',
    description: '',
  },
  // Metadata configuration
  defaultMetadata: {},
  setMetadata,
  getMetadata,
  resetMetadata,
  // Lazy loading configuration
  lazyLoading: {
    enabled: true,
    preloadOnHover: false,
    preloadOnFocus: false,
    timeout: 30000,
    logMetrics: process.env.NODE_ENV === 'development',
  },
}

/**
 * Get or initialize the page configuration singleton
 * Uses lazy initialization to avoid module-level side effects for better tree-shaking
 */
function initializePageConfig(): PageConfigProps {
  _pageConfig = {
    HeaderContainer: DefaultContainer,
    FooterContainer: DefaultContainer,
    BodyContainer: DefaultContainer,
    authPageImage: '',
    authPageProps: { id: 'auth-page' },
    isLogged: (val: AuthState | null) => !!val?.id && !!val.isLogged,
    ItemsContainer: ({ children }) => children,
    PageContainer: ({ children }) => children,
    meta: {
      title: '',
      description: '',
    },
    // Metadata configuration
    defaultMetadata: {},
    setMetadata,
    getMetadata,
    resetMetadata,
    // Lazy loading configuration
    lazyLoading: {
      enabled: true,
      preloadOnHover: false,
      preloadOnFocus: false,
      timeout: 30000,
      logMetrics: process.env.NODE_ENV === 'development',
    },
  }
  return _pageConfig
}

// Getter for pageConfig - initializes on first access
export function getPageConfig(): PageConfigProps {
  return initializePageConfig()
}

export const {
  atom: pageConfigAtom,
  useValue: usePageConfigValue,
  useState: usePageConfigState,
  useReset: usePageConfigReset,
} = atomStateGenerator<PageConfigProps>({
  key: 'pageConfig',
  defaultValue: _pageConfig,
  persist: false,
})

// Re-export metadata functions (backward compat)
export { setMetadata, getMetadata, resetMetadata } from './metadata'

// Re-export new metadata architecture
export { resolveMetadata } from './resolveMetadata'
export {
  applyMetadataToDom,
  collectMetadataToHtml,
  createMetadataStore,
} from './metadata'
export {
  MetadataStoreProvider,
  useMetadataStore,
} from './MetadataStoreProvider'

// Re-export logging utilities
export {
  setMetadataLogging,
  logMetadata,
  getMetadataLog,
  clearMetadataLog,
} from './metadataLogger'

// Re-export types
export type {
  MetadataConfig,
  MetaTag,
  MetadataProvider,
  MetadataStore,
  LazyLoadingConfig,
  ResolvedMetadata,
  OpenGraphConfig,
  OpenGraphImage,
  OpenGraphArticle,
  TwitterCardConfig,
  AlternatesConfig,
  IconsConfig,
  IconConfig,
  StructuredDataConfig,
  AIHintsConfig,
  RobotsConfig,
  LlmsTxtConfig,
  LlmsTxtEntry,
} from './types'
