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

type UserAttributeValueByType = {
  'string': string
  'string-array': string[]
  'integer': number
  'integer-array': number[]
  'number': number
  'number-array': number[]
  'boolean': boolean
}

/** @public */
export type UserAttributeValue = UserAttributeValueByType[UserAttributeType]

/** @public */
export type CurrentUserAttribute = {
  [T in UserAttributeType]: {key: string; type: T; value: UserAttributeValueByType[T]}
}[UserAttributeType]

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
