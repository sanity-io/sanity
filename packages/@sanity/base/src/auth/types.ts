export interface SanityAuthProvider {
  logo?: string
  name: string
  title: string
  url?: string
  custom?: boolean
  supported?: boolean
}

export interface SanityUser {
  email: string
  id: string
  name: string
  profileImage: string
  provider: string
  role: string
  roles: {
    description: string
    name: string
    title: string
  }[]
}

export interface AuthState {
  error: Error | null
  loaded: boolean
  providers?: SanityAuthProvider[] | null
  user: SanityUser | null
}

export interface AuthContextValue extends AuthState {
  logout: () => void
}
