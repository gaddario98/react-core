import { useCallback, useEffect, useRef, useState } from "react";
import equal from "fast-deep-equal";
import {
  DEFAULT_MUTATION_ENTRY,
  DEFAULT_QUERY_ENTRY,
  useJotaiMutations,
  useJotaiQueries,
} from ".";
import type { GetApiValuesFunction, QueriesArray } from "../types";

const getValueAtPath = (
  obj: unknown,
  path: string,
  defaultObj?: unknown,
): unknown => {
  if (!path) return undefined;
  const normalized = path.replace(/\[(\d+)\]/g, ".$1");
  const parts = normalized.split(".").filter(Boolean);
  let current: unknown = obj;

  for (let index = 0; index < parts.length; index++) {
    const part = parts[index];
    if (current == null) return undefined;
    if (typeof current !== "object") return undefined;

    const record = current as Record<string, unknown>;

    // Only apply the default entry when the *root* key is missing (e.g. queryKey not found).
    // For deeper missing paths, return undefined so callers can use the provided defaultValue.
    if (!(part in record)) {
      if (index === 0 && defaultObj !== undefined) {
        current = defaultObj;
        continue;
      }
      return undefined;
    }

    current = record[part];
  }

  return current;
};

interface UseApiValuesProps {
  scopeId: string;
}

export const useApiValues = <Q extends QueriesArray>({
  scopeId,
}: UseApiValuesProps) => {
  const allQuery = useJotaiQueries<Q>({ scopeId });
  const allMutation = useJotaiMutations<Q>({ scopeId });
  const subscriptions = useRef(new Map<string, unknown>());
  const [trigger, setTrigger] = useState(0);

  const dataRef = useRef({
    query: allQuery,
    mutation: allMutation,
  });

  // Sync dataRef with latest values
  useEffect(() => {
    let internalTrigger = false;
    const currentQuery = dataRef.current.query;
    subscriptions.current.forEach((_, key) => {
      const [type, keyPath] = key.split(":");
      if (type === "query") {
        const newValue = getValueAtPath(allQuery, keyPath);
        const oldValue = getValueAtPath(currentQuery, keyPath);
        // console.log(key, !equal(newValue, oldValue), newValue, oldValue)
        if (!equal(newValue, oldValue)) {
          internalTrigger = true;
        }
      }
      if (type === "mutation") {
        const newValue = getValueAtPath(allMutation, keyPath);
        const oldValue = getValueAtPath(dataRef.current.mutation, keyPath);
        if (!equal(newValue, oldValue)) {
          internalTrigger = true;
        }
      }
    });
    dataRef.current = {
      query: allQuery,
      mutation: allMutation,
    };
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (internalTrigger) {
      setTrigger((v) => v + 1);
    }
  }, [allQuery, allMutation]);

  // get che legge dallo store e registra le dipendenze
  const get = useCallback(
    (
      type: Parameters<GetApiValuesFunction<Q>>[0],
      key: Parameters<GetApiValuesFunction<Q>>[1],
      defaultValue?: Parameters<GetApiValuesFunction<Q>>[2],
    ) => {
      const keyMap = `${type}:${key}`;
      const defaultQueries =
        type === "query"
          ? DEFAULT_QUERY_ENTRY
          : // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            type === "mutation"
            ? DEFAULT_MUTATION_ENTRY
            : undefined;

      const value =
        getValueAtPath(dataRef.current[type], String(key), defaultQueries) ??
        defaultValue;
      subscriptions.current.set(keyMap, value);
      return subscriptions.current.get(keyMap);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trigger],
  ) as GetApiValuesFunction<Q>;

  return { get };
};
