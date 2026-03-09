/**
 * HTTP Client pour communiquer avec le backend Express
 * Toutes les requêtes de données passent par le backend
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000'
const REQUEST_TIMEOUT = 10000 // 10 secondes

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  success: boolean
}

class HttpClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'HttpClientError'
  }
}

export class HttpClient {
  static async post<T>(endpoint: string, body: any): Promise<T> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

      const response = await fetch(`${BACKEND_URL}/api${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.text()
        throw new HttpClientError('API_ERROR', `API Error: ${response.status} - ${error}`, response.status)
      }

      return (await response.json()) as T
    } catch (err) {
      if (err instanceof HttpClientError) {
        console.error(`❌ API request to ${endpoint} failed:`, err.message)
      } else if (err instanceof Error) {
        if (err.name === 'AbortError') {
          console.error(`❌ Request to ${endpoint} timed out`)
          throw new HttpClientError('TIMEOUT', `Request to ${endpoint} timed out`)
        } else {
          console.error(`❌ Network request to ${endpoint} failed:`, err.message)
          throw new HttpClientError('NETWORK_ERROR', `Network request to ${endpoint} failed: ${err.message}`)
        }
      }
      throw err
    }
  }

  static async get<T>(endpoint: string): Promise<T> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

      const response = await fetch(`${BACKEND_URL}/api${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.text()
        throw new HttpClientError('API_ERROR', `API Error: ${response.status} - ${error}`, response.status)
      }

      return (await response.json()) as T
    } catch (err) {
      if (err instanceof HttpClientError) {
        console.error(`❌ API request to ${endpoint} failed:`, err.message)
      } else if (err instanceof Error) {
        if (err.name === 'AbortError') {
          console.error(`❌ Request to ${endpoint} timed out`)
          throw new HttpClientError('TIMEOUT', `Request to ${endpoint} timed out`)
        } else {
          console.error(`❌ Network request to ${endpoint} failed:`, err.message)
          throw new HttpClientError('NETWORK_ERROR', `Network request to ${endpoint} failed: ${err.message}`)
        }
      }
      throw err
    }
  }
}