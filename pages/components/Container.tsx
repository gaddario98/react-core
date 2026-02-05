import { memo, useMemo } from 'react'
import { useGenerateContentRender } from '../hooks/useGenerateContentRender'
import { usePageConfigValue } from '../config'
import { deepEqual } from '../utils/optimization'
import type { FieldValues } from '@gaddario98/react-form'
import type { ItemContainerProps } from './types'
import type { QueriesArray } from '@gaddario98/react-queries'

const ContainerImpl = <
  F extends FieldValues,
  Q extends QueriesArray,
  V extends Record<string, unknown> = Record<string, unknown>,
>({
  content,
  ns,
  pageId,
}: ItemContainerProps<F, Q, V>) => {
  const { ItemsContainer } = usePageConfigValue()
  const { components } = useGenerateContentRender<F, Q, V>({
    pageId,
    contents: content.items,
    ns,
    formData: { elements: [], formContents: [], errors: [], formValues: {} as F, setValue: () => { } },
  })

  const CustomContainer = useMemo(() => content.component, [content.component])
  const children = useMemo(
    () => components.map((el) => el.element),
    [components],
  )

  if (!CustomContainer) {
    return <ItemsContainer>{children}</ItemsContainer>
  }
  return <CustomContainer>{children}</CustomContainer>
}

// Export with React.memo and fast-deep-equal comparator for optimal performance
export const Container = memo(ContainerImpl, (prevProps, nextProps) => {
  // Return true if props are equal (component should NOT re-render)
  return deepEqual(prevProps, nextProps)
}) as typeof ContainerImpl
