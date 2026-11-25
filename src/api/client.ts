import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { getAccessToken, setAccessToken } from './token'

export interface ProblemDetail {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  errors?: Array<{ field: string; message: string }>
}

export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  timeout: 15000,
})

const refreshClient = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await refreshClient.post<{ accessToken: string }>('/auth/refresh')
    setAccessToken(data.accessToken)
    return data.accessToken
  } catch {
    setAccessToken(null)
    return null
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined
    const isAuthCall = original?.url?.startsWith('/auth/')

    if (error.response?.status !== 401 || !original || original._retry || isAuthCall) {
      throw error
    }

    original._retry = true
    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null
    })

    const token = await refreshPromise
    if (!token) {
      throw error
    }

    original.headers = { ...original.headers, Authorization: `Bearer ${token}` }
    return api.request(original)
  },
)

export function errorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const problem = error.response?.data as ProblemDetail | undefined
    if (problem?.errors?.length) {
      return problem.errors.map((fieldError) => fieldError.message).join('. ')
    }
    if (problem?.detail) {
      return problem.detail
    }
    if (error.code === 'ERR_NETWORK') {
      return 'No se pudo conectar con el servidor.'
    }
  }
  return 'Ha ocurrido un error inesperado.'
}
