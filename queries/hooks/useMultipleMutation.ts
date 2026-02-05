/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { useApiConfigValue } from "../config";
import { DEFAULT_MUTATION_ENTRY } from ".";
import type {
  AllMutation,
  MutationActionInternal,
  MutationConfig,
  MutationItem,
  MutationStateInternal,
  QueriesArray,
} from "../types";

const defaultState: MutationStateInternal = DEFAULT_MUTATION_ENTRY;

type MutationStates = Record<string, MutationStateInternal>;

const mutationReducer = (
  state: MutationStates,
  action: MutationActionInternal,
): MutationStates => {
  switch (action.type) {
    case "RESET":
      return {
        ...state,
        [action.key]: { ...defaultState },
      };
    case "PENDING":
      return {
        ...state,
        [action.key]: {
          status: "pending",
          data: undefined,
          error: null,
          submittedAt: action.submittedAt,
          variables: action.variables,
        },
      };
    case "SUCCESS":
      return {
        ...state,
        [action.key]: {
          ...state[action.key],
          status: "success",
          data: action.data,
          error: null,
        },
      };
    case "ERROR":
      return {
        ...state,
        [action.key]: {
          ...state[action.key],
          status: "error",
          error: action.error,
        },
      };
    default:
      return state;
  }
};

const initMutationStates = <Q extends QueriesArray>(
  configs: Array<MutationItem<Q>>,
): MutationStates => {
  const states: MutationStates = {};
  configs.forEach((config) => {
    states[config.key] = { ...defaultState };
  });
  return states;
};

export const useMultipleMutation = <Q extends QueriesArray>(
  configs: Array<MutationItem<Q>>,
): AllMutation<Q> => {
  const {
    requestFn,
    validateAuthFn,
    defaultHeaders,
    queryClient,
    showNotification,
    endpoints,
  } = useApiConfigValue();

  const [reducerStates, dispatchReducer] = useReducer(
    mutationReducer,
    configs,
    initMutationStates,
  );

  // Accessor for current state
  const getState = useCallback(
    (key: string) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      return reducerStates[key] || defaultState;
    },
    [reducerStates],
  );

  // Dispatcher that handles both modes
  const dispatch = useCallback((action: MutationActionInternal) => {
    dispatchReducer(action);
  }, []);

  const executeMutation = useCallback(
    async <TProps, TResponse>(
      key: string,
      config: MutationConfig<TProps, TResponse>,
      data: TProps,
      mutationOptions?: {
        onSuccess?: (
          data: TResponse,
          variables: TProps,
          onMutateResult: unknown,
          context: unknown,
        ) => void;
        onError?: (
          error: Error,
          variables: TProps,
          onMutateResult: unknown,
          context: unknown,
        ) => void;
        onSettled?: (
          data: TResponse | undefined,
          error: Error | null,
          variables: TProps,
          onMutateResult: unknown,
          context: unknown,
        ) => void;
      },
    ): Promise<TResponse> => {
      const {
        endpoint,
        method,
        headers,
        queryKeyToInvalidate,
        customRequest,
        converter,
        isTest,
        notification,
        mutateOptions,
      } = config;

      dispatch({
        type: "PENDING",
        key,
        submittedAt: Date.now(),
        variables: data,
      });

      let context: unknown;

      try {
        // Auth validation
        const isValidAuth = validateAuthFn ? validateAuthFn() : true;

        if (!isValidAuth) {
          throw new Error("Utente non autenticato");
        }

        // Build endpoint
        const [endpointKey, path] = endpoint;
        const baseUrl = endpoints[endpointKey] ?? "";
        const fullEndpoint = [baseUrl, path].filter(Boolean).join("/");

        // Merge headers
        const mergedHeaders = {
          ...defaultHeaders,
          ...headers,
        };

        // Execute request
        let result: TResponse;

        if (isTest) {
          result = "test" as unknown as TResponse;
        } else if (customRequest) {
          result = await customRequest(fullEndpoint, method, data);
        } else {
          result = await requestFn({
            url: fullEndpoint,
            method,
            body: data,
            headers: mergedHeaders,
            converter,
          });
        }

        dispatch({ type: "SUCCESS", key, data: result });

        // Invalidate queries
        if (queryKeyToInvalidate) {
          queryKeyToInvalidate.forEach((qKey) => {
            queryClient.invalidateQueries({ queryKey: [qKey], exact: false });
          });
        }

        // Success notification
        const notificationProps =
          typeof notification?.success === "function"
            ? notification.success(result)
            : notification?.success;

        if (notificationProps?.message) {
          showNotification?.({
            message: notificationProps.message,
            type: notificationProps.type ?? "success",
            ...notificationProps,
          });
        }

        // Callbacks
        // @ts-expect-error - MutateOptions callback signature varies by TanStack Query version
        mutateOptions?.onSuccess?.(result, data, context);
        mutationOptions?.onSuccess?.(result, data, undefined, context);

        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Unknown error");
        dispatch({ type: "ERROR", key, error: err });

        // Error notification
        const notificationProps =
          typeof notification?.error === "function"
            ? notification.error(err.message)
            : notification?.error;

        if (notificationProps?.message || err.message) {
          showNotification?.({
            message:
              notificationProps?.message ||
              err.message ||
              "An unexpected error occurred",
            type: notificationProps?.type ?? "error",
            ...notificationProps,
          });
        }

        // Callbacks
        // @ts-expect-error - MutateOptions callback signature varies by TanStack Query version
        mutateOptions?.onError?.(err, data, context);
        mutationOptions?.onError?.(err, data, undefined, context);

        throw err;
      }
    },
    [
      queryClient,
      validateAuthFn,
      defaultHeaders,
      endpoints,
      requestFn,
      showNotification,
      dispatch, // dispatch is now stable/wrapped
    ],
  );

  const ref = useRef({ dispatch, executeMutation });

  useEffect(() => {
    ref.current = { dispatch, executeMutation };
  }, [dispatch, executeMutation]);

  const allMutation = useMemo(() => {
    const result = {} as AllMutation<Q>;

    configs.forEach((item) => {
      // In silent mode, this is just the INITIAL state (or whatever triggered last render).
      // The real data comes from Proxy if used.
      const state = getState(item.key);
      const mutationConfig = item.mutationConfig;

      const mutationKey = item.key as keyof AllMutation<Q>;

      type CurrentMutation = Extract<
        Q[number],
        { key: typeof item.key; type: "mutation" }
      >;
      type MutationData = CurrentMutation["response"];
      type MutationVariables = CurrentMutation["props"];

      result[mutationKey] = {
        // State
        data: state.data as MutationData,
        error: state.error as Error,
        isIdle: state.status === "idle",
        isPending: state.status === "pending",
        isSuccess: state.status === "success",
        isError: state.status === "error",
        status: state.status,
        variables: state.variables as MutationVariables,
        submittedAt: state.submittedAt ?? 0,
        endpoint: mutationConfig.endpoint,

        // Methods
        mutate: (
          data: MutationVariables,
          mutationOptions?: {
            onSuccess?: (
              data: MutationData,
              variables: MutationVariables,
              onMutateResult: unknown,
              context: any,
            ) => void;
            onError?: (
              error: Error,
              variables: MutationVariables,
              onMutateResult: unknown,
              context: any,
            ) => void;
            onSettled?: (
              data: MutationData | undefined,
              error: Error | null,
              variables: MutationVariables,
              onMutateResult: unknown,
              context: any,
            ) => void;
          },
        ) => {
          ref.current.executeMutation(
            item.key,
            mutationConfig,
            data,
            mutationOptions,
          );
        },
        mutateAsync: (
          data: MutationVariables,
          mutationOptions?: {
            onSuccess?: (
              data: MutationData,
              variables: MutationVariables,
              onMutateResult: unknown,
              context: any,
            ) => void;
            onError?: (
              error: Error,
              variables: MutationVariables,
              onMutateResult: unknown,
              context: any,
            ) => void;
            onSettled?: (
              data: MutationData | undefined,
              error: Error | null,
              variables: MutationVariables,
              onMutateResult: unknown,
              context: any,
            ) => void;
          },
        ) => {
          return ref.current.executeMutation(
            item.key,
            mutationConfig,
            data,
            mutationOptions,
          );
        },
        reset: () => ref.current.dispatch({ type: "RESET", key: item.key }),

        // Compatibility fields
        failureCount: 0,
        failureReason: null,
        context: undefined,
        isPaused: false,
      } as AllMutation<Q>[keyof AllMutation<Q>];
      item.mutationConfig.onStateChange?.(result[mutationKey]);
    });

    return result;
  }, [getState, configs]);

  return allMutation;
};
