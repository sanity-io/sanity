import {type SanityClient} from '@sanity/client'
import {useCallback, useMemo} from 'react'
import {useCurrentUser} from 'sanity'

import {
  type TaskCreatePayload,
  type TaskDocument,
  type TaskEditPayload,
  type TaskOperations,
} from '../../types'

interface TaskOperationsOptions {
  client: SanityClient | null
  createAddonDataset: () => Promise<SanityClient | null>
}

export function useTaskOperations(opts: TaskOperationsOptions): TaskOperations {
  const {client, createAddonDataset} = opts
  const currentUser = useCurrentUser()

  const handleCreate = useCallback(
    async (payload: TaskCreatePayload): Promise<TaskDocument> => {
      if (!currentUser) {
        throw new Error('No current user found. Unable to create task.')
      }

      const task = {
        ...payload,
        authorId: currentUser.id,
        _type: 'tasks.task',
      } satisfies Partial<TaskDocument>

      if (!client) {
        try {
          const newCreatedClient = await createAddonDataset()
          if (!newCreatedClient) throw new Error('No addon client found. Unable to create task.')
          const created = await newCreatedClient.create(task)
          return created
        } catch (err) {
          // TODO: Handle error
          throw err
        }
      }

      try {
        const created = await client.create(task)
        return created
      } catch (err) {
        // TODO: Handle error
        throw err
      }
    },
    [client, createAddonDataset, currentUser],
  )

  const handleEdit = useCallback(
    async (id: string, set: TaskEditPayload) => {
      try {
        if (!client) {
          throw new Error('No client. Unable to create task.')
        }
        const edited = (await client.patch(id).set(set).commit()) as TaskDocument
        return edited
      } catch (e) {
        // TODO: Handle error
        throw e
      }
    },
    [client],
  )
  const handleRemove = useCallback(
    async (id: string) => {
      try {
        if (!client) {
          throw new Error('No client. Unable to create task.')
        }
        await client.delete(id)
      } catch (e) {
        // TODO: Handle error
        throw e
      }
    },
    [client],
  )

  const operations: TaskOperations = useMemo(
    () => ({
      create: handleCreate,
      edit: handleEdit,
      remove: handleRemove,
    }),
    [handleCreate, handleEdit, handleRemove],
  )
  return operations
}
