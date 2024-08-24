import {useCallback, useMemo} from 'react'
import {filter, firstValueFrom, map} from 'rxjs'
import {isClientStoreReady} from 'sanity'

import {useAddonDatasetStore, useCurrentUser} from '../../store'
import {type TaskCreatePayload, type TaskDocument, type TaskEditPayload} from '../types'

/**
 * @beta
 * @hidden
 */
export interface TaskOperations {
  create: (task: TaskCreatePayload) => Promise<TaskDocument>
  edit: (id: string, task: TaskEditPayload) => Promise<TaskDocument>
  remove: (id: string) => Promise<void>
}

/**
 * @beta
 * @hidden
 */
export function useTaskOperations(): TaskOperations {
  const {client$} = useAddonDatasetStore()
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

      try {
        const client = await firstValueFrom(
          client$.pipe(
            filter(isClientStoreReady),
            map((clientStore) => clientStore.client),
          ),
        )

        const created = await client.create(task)
        return created
      } catch (err) {
        // TODO: Handle error
        throw err
      }
    },
    [client$, currentUser],
  )

  const handleEdit = useCallback(
    async (id: string, set: TaskEditPayload) => {
      try {
        const client = await firstValueFrom(
          client$.pipe(
            filter(isClientStoreReady),
            map((clientStore) => clientStore.client),
          ),
        )

        const edited = (await client.patch(id).set(set).commit()) as TaskDocument
        return edited
      } catch (e) {
        // TODO: Handle error
        throw e
      }
    },
    [client$],
  )
  const handleRemove = useCallback(
    async (id: string) => {
      try {
        const client = await firstValueFrom(
          client$.pipe(
            filter(isClientStoreReady),
            map((clientStore) => clientStore.client),
          ),
        )

        await client.delete(id)
      } catch (e) {
        // TODO: Handle error
        throw e
      }
    },
    [client$],
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
