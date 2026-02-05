import { memo, useMemo } from 'react'
import { RenderComponents } from '../components'
import { usePageValues } from './usePageValues'
import type { QueriesArray } from '@gaddario98/react-queries'
import type {
  FieldValues,
  FormElements,
  FormManagerConfig,
  SetValueFunction,
  Submit,
  SubmitKeysArg,
} from '@gaddario98/react-form'
import type { ContentItem, ContentItemsType } from '../types'

export interface GenerateContentRenderProps<
  F extends FieldValues,
  Q extends QueriesArray,
  V extends Record<string, unknown> = Record<string, unknown>,
> {
  contents?: ContentItemsType<F, Q, V>
  ns?: string
  pageId: string
  formData: {
    formContents: Array<Submit<F, SubmitKeysArg<F>> | FormManagerConfig<F>>;
    elements: Array<FormElements>;
    errors: Array<unknown>;
    formValues: F;
    setValue: SetValueFunction<F>;
  }
}
export interface Elements {
  index: number
  element: JSX.Element
  renderInFooter: boolean
  renderInHeader: boolean
  key: string
}

const getStableKey = <
  F extends FieldValues,
  Q extends QueriesArray,
  V extends Record<string, unknown> = Record<string, unknown>,
>(
  content: ContentItem<F, Q, V>,
  index: number,
) => content.key ?? `content-${index}`

interface PageContentItemProps<
  F extends FieldValues,
  Q extends QueriesArray,
  V extends Record<string, unknown> = Record<string, unknown>,
> {
  item: ContentItem<F, Q, V>
  pageId: string
  ns: string
}

const PageContentItemInner = <
  F extends FieldValues,
  Q extends QueriesArray,
  V extends Record<string, unknown> = Record<string, unknown>,
>({
  item,
  pageId,
  ns,
}: PageContentItemProps<F, Q, V>) => {
  const { get, set } = usePageValues<F, Q, V>({ pageId })

  const isHidden = useMemo(() => {
    if (typeof item.hidden === 'function') {
      return item.hidden({ get, set })
    }
    return !!item.hidden
  }, [get, item, set])

  if (isHidden) return null

  return (
    <RenderComponents<F, Q, V>
      content={item}
      ns={ns}
      pageId={pageId}
      key={item.key ?? ''}
    />
  )
}

const PageContentItem = memo(
  PageContentItemInner,
) as typeof PageContentItemInner

export const useGenerateContentRender = <
  F extends FieldValues,
  Q extends QueriesArray,
  V extends Record<string, unknown> = Record<string, unknown>,
>({
  pageId,
  ns = '',
  contents = [],
  formData,
}: GenerateContentRenderProps<F, Q, V>) => {
  const { get, set } = usePageValues<F, Q, V>({ pageId })

  const contentsWithQueriesDeps = useMemo(() => {
    if (typeof contents === 'function') {
      return contents({ get, set })
    }
    return Array.isArray(contents) ? contents : []
  }, [contents, get, set])

  // Memoize form elements separately - only recalculate when formData.elements changes
  const formElementsWithKey = useMemo(() => {
    if (!Array.isArray(formData.elements)) return []
    return formData.elements.map((el: FormElements, idx: number) => ({
      ...el,
      key: `form-element-${el.index || idx}`,
    }))
  }, [formData.elements])

  // Memoize dynamic elements - only recalculate when contents change
  const dynamicElements = useMemo(
    () =>
      contentsWithQueriesDeps.map((content, index: number) => {
        const stableKey = getStableKey(content, index)
        return {
          element: (
            <PageContentItem<F, Q, V>
              item={content}
              ns={ns}
              pageId={pageId}
              key={stableKey}
            />
          ),
          index: content.index ?? index,
          renderInFooter: !!content.renderInFooter,
          renderInHeader: !!content.renderInHeader,
          key: stableKey,
        }
      }),
    [contentsWithQueriesDeps, ns, pageId],
  )

  // Merge and sort - only when either array changes
  const memorizedContents = useMemo(
    () =>
      [...dynamicElements, ...formElementsWithKey].sort(
        (a, b) =>
          a.index - b.index || String(a.key).localeCompare(String(b.key)),
      ),
    [dynamicElements, formElementsWithKey],
  )

  return {
    components: memorizedContents,
    allContents: [...contentsWithQueriesDeps, ...formData.formContents],
  }
}
