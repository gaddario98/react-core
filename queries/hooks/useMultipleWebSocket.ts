import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApiConfigValue } from '../config'
import type { MultipleWebSocketResponse, WebSocketDefinition } from '../types'

export const useMultipleWebSocket = <K extends string>(
  configs: Array<WebSocketDefinition<K>> = [],
): MultipleWebSocketResponse<K> => {
  const { websocketConfig } = useApiConfigValue()
  const { queryClient } = useApiConfigValue()

  const socketsRef = useRef<Map<string, WebSocket>>(new Map())
  const [statuses, setStatuses] = useState<
    Map<string, 'connecting' | 'open' | 'closed'>
  >(new Map())
  const [lastMessages, setLastMessages] = useState<Map<string, unknown>>(
    new Map(),
  )

  // Stabilize configs reference
  const stableConfigs = useMemo(() => configs, [configs])

  useEffect(() => {
    const sockets = socketsRef.current

    stableConfigs.forEach((config) => {
      const url = config.endpoint || websocketConfig?.url
      const shouldConnect =
        config.autoConnect !== false &&
        (websocketConfig?.autoConnect || config.endpoint)

      if (!url || !shouldConnect) return

      // Skip if already connected
      if (sockets.has(config.key)) return

      setStatuses((prev) => new Map(prev).set(config.key, 'connecting'))

      const ws = new WebSocket(url)
      sockets.set(config.key, ws)

      ws.onopen = () => {
        setStatuses((prev) => new Map(prev).set(config.key, 'open'))
        console.log(`WebSocket [${config.key}] connected`)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setLastMessages((prev) => new Map(prev).set(config.key, data))

          // Global handler
          websocketConfig?.onMessage?.(data)

          // Local handler
          config.onMessage?.(data)

          // Auto invalidation
          if (
            config.invalidateQueriesOnMessage &&
            Array.isArray(config.invalidateQueriesOnMessage)
          ) {
            config.invalidateQueriesOnMessage.forEach((key) => {
              queryClient.invalidateQueries({ queryKey: [key], exact: false })
            })
          }
        } catch (e) {
          console.error(`WebSocket [${config.key}] message parse error`, e)
        }
      }

      ws.onclose = () => {
        setStatuses((prev) => new Map(prev).set(config.key, 'closed'))
        console.log(`WebSocket [${config.key}] disconnected`)
        sockets.delete(config.key)
      }
    })

    return () => {
      sockets.forEach((ws, key) => {
        ws.close()
        sockets.delete(key)
      })
    }
  }, [stableConfigs, websocketConfig, queryClient])

  const createSendMessage = useCallback(
    (key: string) => (message: unknown) => {
      const ws = socketsRef.current.get(key)
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message))
      } else {
        console.warn(`WebSocket [${key}] is not open`)
      }
    },
    [],
  )

  const result = useMemo(() => {
    const mapped = {} as MultipleWebSocketResponse<K>

    stableConfigs.forEach((config) => {
      mapped[config.key] = {
        lastMessage: lastMessages.get(config.key) ?? null,
        sendMessage: createSendMessage(config.key),
        status: statuses.get(config.key) ?? 'closed',
      }
    })

    return mapped
  }, [stableConfigs, lastMessages, statuses, createSendMessage])

  return result
}
