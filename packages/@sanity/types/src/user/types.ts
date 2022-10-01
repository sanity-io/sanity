/** @public */
export interface Role {
  name: string
  title: string
  description?: string
}

/** @public */
export interface CurrentUser {
  id: string
  name: string
  email: string
  profileImage?: string
  provider?: string
  /** @deprecated use `roles` instead */
  role: string
  roles: Role[]
}

/** @public */
export interface User {
  id: string
  displayName?: string
  imageUrl?: string
  email?: string
}
