import { useMemo } from 'react'
import { useGenerateContentRender } from './useGenerateContentRender'
import type { FieldValues } from '@gaddario98/react-form'
import type { usePageConfig } from './usePageConfig'
import type {
  ContentItemsType,
} from '../types'
import type { QueriesArray } from '@gaddario98/react-queries'

export interface GenerateContentProps<
  F extends FieldValues,
  Q extends QueriesArray,
  V extends Record<string, unknown> = Record<string, unknown>,
> {
  pageId: string
  ns?: string
  contents: ContentItemsType<F, Q, V>
  pageConfig: ReturnType<typeof usePageConfig<F, Q, V>>
}



export const useGenerateContent = <
  F extends FieldValues,
  Q extends QueriesArray,
  V extends Record<string, unknown> = Record<string, unknown>,
>({
  pageId,
  ns = '',
  contents = [],
  pageConfig,
}: GenerateContentProps<F, Q, V>) => {
  const { formData } = useMemo(() => pageConfig, [pageConfig])
  const { allContents, components } = useGenerateContentRender<F, Q, V>({
    formData,
    pageId,
    contents,
    ns,
  })
  const body = useMemo(
    () =>
      components
        .filter((el) => !el.renderInFooter && !el.renderInHeader)
        .map((item) => item.element),
    [components],
  )
  const header = useMemo(
    () =>
      components.filter((el) => el.renderInHeader).map((item) => item.element),
    [components],
  )
  const footer = useMemo(
    () =>
      components.filter((el) => el.renderInFooter).map((item) => item.element),
    [components],
  )
  return { header, body, footer, allContents }
}
