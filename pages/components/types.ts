import type { FieldValues } from '@gaddario98/react-form'
import type { QueriesArray } from '@gaddario98/react-queries'
import type { ContainerItem, ContentItem, Items } from '../types'

export interface Props<
  F extends FieldValues = FieldValues,
  Q extends QueriesArray = QueriesArray,
  V extends Record<string, unknown> = Record<string, unknown>,
> {
  content: ContentItem<F, Q, V>
  ns: string
  pageId: string
}

export interface ContentProps<
  F extends FieldValues = FieldValues,
  Q extends QueriesArray = QueriesArray,
  V extends Record<string, unknown> = Record<string, unknown>,
> extends Omit<Props<F, Q, V>, 'content'> {
  content: Items<F, Q, V>
  pageId: string
}

export interface ItemContainerProps<
  F extends FieldValues = FieldValues,
  Q extends QueriesArray = QueriesArray,
  V extends Record<string, unknown> = Record<string, unknown>,
> extends Omit<Props<F, Q, V>, 'content'> {
  content: ContainerItem<F, Q, V>
}
