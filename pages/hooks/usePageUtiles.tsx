import { useCallback } from "react";
import type { FieldValues } from "@gaddario98/react-form";
import type { QueriesArray } from "@gaddario98/react-queries";
import type {  ContentItem } from "../types";

export const usePageUtiles = () => {
  const getContentProps = useCallback(
    <
      F extends FieldValues = FieldValues,
      Q extends QueriesArray = QueriesArray,
    >(
      props: ContentItem<F, Q>
    ) => props,
    []
  );
  const getContentItems = useCallback(
    <
      F extends FieldValues = FieldValues,
      Q extends QueriesArray = QueriesArray,
    >(
      props: Array<ContentItem<F, Q>>
    ) => props,
    []
  );

  return { getContentProps, getContentItems };
};
