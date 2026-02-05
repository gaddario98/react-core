import { Container } from "./Container"
import { RenderComponent } from "./RenderComponent"
import type { FieldValues } from "@gaddario98/react-form"
import type { QueriesArray } from "@gaddario98/react-queries"
import type { RenderComponentsProps } from "../types"

export const RenderComponents = <
  F extends FieldValues,
  Q extends QueriesArray,
  V extends Record<string, unknown> = Record<string, unknown>,
>(
  props: RenderComponentsProps<F, Q, V>,
) => {
  if (props.content.type === 'container') {
    return (
      <Container<F, Q, V>
        key={props.key}
        content={props.content}
        ns={props.ns}
        pageId={props.pageId}
      />
    )
  }
  return (
    <RenderComponent<F, Q, V>
      key={props.key}
      content={props.content}
      ns={props.ns}
      pageId={props.pageId}
    />
  )
}