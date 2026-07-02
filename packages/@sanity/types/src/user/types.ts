/** @public */
export interface Role {
  name: string
  title: string
  description?: string
}

/** @public */
export type UserAttributeType =
  | 'string'
  | 'string-array'
  | 'integer'
  | 'integer-array'
  | 'number'
  | 'number-array'
  | 'boolean'

/** @public */
export type UserAttributeValue = string | number | boolean | string[] | number[]

/** @public */
export interface CurrentUserAttribute {
  key: string
  type: UserAttributeType
  value: UserAttributeValue
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
  /**
   * Organization-scoped user attributes for the current project.
   * Only present when returned by `/users/me` with a project context.
   */
  attributes?: CurrentUserAttribute[]
}

/** @public */
export interface User {
  id: string
  displayName?: string
  imageUrl?: string
  email?: string
}
