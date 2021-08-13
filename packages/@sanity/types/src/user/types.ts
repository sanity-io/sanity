export interface Role {
  name: string
  title: string
  description?: string
}

export interface CurrentUser {
  id: string
  name: string
  email: string
  profileImage?: string
  /** @deprecated use `roles` instead */
  role: string
  roles: Role[]
}

export interface User {
  id: string
  displayName?: string
  imageUrl?: string
  email?: string
}
