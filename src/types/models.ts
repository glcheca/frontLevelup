export interface User {
  id: string
  email: string
  name: string
  timezone: string
  locale: string
  theme: 'light' | 'dark' | 'system'
}

export interface AuthResponse {
  accessToken: string
  user: User
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest extends LoginRequest {
  name: string
  timezone?: string
}
