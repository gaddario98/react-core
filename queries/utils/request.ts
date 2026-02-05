import axios from 'axios'
import type { ApiRequestFnProps } from '../config'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'

const apiClient = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      throw new Error(
        error.response.data?.message ||
          error.response.data?.error ||
          `Error ${error.response.status}`,
      )
    } else if (error.request) {
      throw new Error(
        'No response from server - request timeout or network issue',
      )
    } else {
      throw new Error('Request configuration error')
    }
  },
)

export const apiRequest = async <TProps, TResponse, TConverter = TProps>({
  method,
  url,
  body,
  headers,
  converter,
}: ApiRequestFnProps<TProps, TConverter>): Promise<TResponse> => {
  try {
    const isPrimitive =
      typeof body === 'string' ||
      typeof body === 'number' ||
      typeof body === 'boolean'

    let finalUrl = url
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let finalBody:any = body

    // 1. Primitive Body Handling (Append to URL)
    if (isPrimitive && body) {
      if (method !== 'POST') {
        finalUrl = `${url}/${body}`
        finalBody = undefined
      }
    }

    // 2. Object Body Handling (Path Param Replacement)
    if (!isPrimitive && typeof body === 'object' && body !== null) {
      // Look for :param in string
      // e.g. /users/:uid/availability
      const pathParams = finalUrl.match(/:[a-zA-Z0-9_]+/g)

      if (pathParams) {
        // Create shallow copy to avoid mutating original
        finalBody = { ...body }

          pathParams.forEach((param) => {
        if (finalBody){
            const key = param.substring(1) // remove :
            if (key in finalBody) {
              finalUrl = finalUrl.replace(param, String(finalBody[key]))
              // Optional: remove from body if it was used in path?
              // Usually yes for simple IDs, maybe not for others.
              // Let's remove to keep body clean.
              delete finalBody[key]
            }}
          })
      }

      // Also handle case where we append ID to end if URL ends with / and we have 'id' or 'uid' in body?
      // No, explicit :param or explicit append logic is safer.
      // But we have logic for 'updateUser' where we just set endpoint ['api', 'users'] and method PUT.
      // We expect /users/123.
      // If body is { uid: 123, ...data }, we want /users/123.
      // If no :param is found, and method is PUT/DELETE/PATCH, and body has 'id' or 'uid', should we append?
      // User asked to eliminate customRequest.
      // Let's add: "If method is PUT/DELETE/PATCH, and no :param replacement happened, and body has (id|uid), append it."
      const hasId = 'id' in finalBody || 'uid' in finalBody
      if (
        (method === 'PUT' || method === 'DELETE' || method === 'PATCH') &&
        hasId &&
        !pathParams
      ) {
        const id = finalBody.id || finalBody.uid
        if (id) {
          finalUrl = `${finalUrl}/${id}`
          // We generally DON'T remove ID from body in this implicit case as it might be needed for validation
          // But for cleaner API calls we might want to.
          // Let's keep it safe: Don't remove ID here.
        }
      }
    }

    const data = converter && finalBody ? converter(finalBody) : finalBody
    const response: AxiosResponse<TResponse> = await apiClient({
      url: finalUrl,
      method,
      data,
      headers,
    })

    if (response.status >= 200 && response.status < 300) {
      return response.data
    }

    throw new Error(`Request failed with status ${response.status}`)
  } catch (error) {
    console.error('API Request Error:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Unknown error occurred')
  }
}

export const fetchRequest = async <TProps, TResponse>(
  url: string,
  headers?: AxiosRequestConfig['headers'],
): Promise<TResponse> => {
  return apiRequest<TProps, TResponse>({ url, method: 'GET', headers })
}
