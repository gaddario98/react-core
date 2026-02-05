import { useCallback, useEffect, useRef, useState } from 'react'
import { useApiConfigValue } from '../config'
import type { WebSocketResult } from '../types'

export const useWebSocket = (
  endpoint?: string, // specific socket endpoint if different from default
  options?: {
    onMessage?: (data: unknown) => void
    invalidateQueriesOnMessage?: Array<string>
  },
): WebSocketResult => {
  const { websocketConfig } = useApiConfigValue()
  const { queryClient } = useApiConfigValue()
  const socketRef = useRef<WebSocket | null>(null)
  const [status, setStatus] = useState<'connecting' | 'open' | 'closed'>(
    'closed',
  )
  const [lastMessage, setLastMessage] = useState<unknown>(null)

  const url = endpoint || websocketConfig?.url

  useEffect(() => {
    if (!url || (!websocketConfig?.autoConnect && !endpoint)) return

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus('connecting')
    const ws = new WebSocket(url)
    socketRef.current = ws

    ws.onopen = () => {
      setStatus('open')
      console.log('WebSocket connected')
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setLastMessage(data)

        // Global handler
        websocketConfig?.onMessage?.(data)

        // Local handler
        options?.onMessage?.(data)

        // Auto invalidation
        if (
          options?.invalidateQueriesOnMessage &&
          Array.isArray(options.invalidateQueriesOnMessage)
        ) {
          options.invalidateQueriesOnMessage.forEach((key) => {
            // Simple invalidation if message matches or triggers generic invalidation
            queryClient.invalidateQueries({ queryKey: [key], exact: false })
          })
        }
      } catch (e) {
        console.error('WebSocket message parse error', e)
      }
    }

    ws.onclose = () => {
      setStatus('closed')
      console.log('WebSocket disconnected')
    }

    return () => {
      ws.close()
      socketRef.current = null
    }
  }, [url, websocketConfig, queryClient, options, endpoint])

  const sendMessage = useCallback((message: unknown) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not open')
    }
  }, [])

  return {
    lastMessage,
    sendMessage,
    status,
  }
}
