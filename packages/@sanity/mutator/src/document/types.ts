import type {
  CreateIfNotExistsMutation,
  CreateMutation,
  CreateOrReplaceMutation,
  DeleteMutation,
  PatchMutation,
} from '@sanity/types'

/**
 * Sanity document with a guaranteed `_id` and `_type`
 *
 * @internal
 */
export interface Doc {
  _id: string
  _type: string
  _rev?: string
  _updatedAt?: string
  [attribute: string]: unknown
}

/**
 * Sanity document that has been persisted to the backend, and thus has
 * both a revision ID and updated/created at timestamps
 *
 * @internal
 */
export interface PersistedDoc extends Doc {
  _rev: string
  _updatedAt: string
  _createdAt: string
}

/**
 * Internal mutation body representation - note that theoretically a
 * mutation can only hold one of these operations each, but for sake
 * of simpler code it is bundled together as one here
 *
 * @internal
 */
export interface Mut {
  create?: CreateMutation['create']
  createIfNotExists?: CreateIfNotExistsMutation['createIfNotExists']
  createOrReplace?: CreateOrReplaceMutation['createOrReplace']
  delete?: DeleteMutation['delete']
  patch?: PatchMutation['patch']
}
