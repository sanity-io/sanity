import {SanityClient} from '@sanity/client'
import {useCallback, useMemo} from 'react'
import {TaskCreatePayload, TaskDocument, TaskEditPayload, TaskOperations} from '../../types'
import {useCurrentUser} from 'sanity'

interface TaskOperationsOptions {
  client: SanityClient | null
  runSetup: () => Promise<SanityClient | null>
}

export function useTaskOperations(opts: TaskOperationsOptions): TaskOperations {
  const {client, runSetup} = opts
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
          const newCreatedClient = await runSetup()
          if (!newCreatedClient) throw new Error('No addon client found. Unable to create task.')
          const created = await newCreatedClient.create(task)
          return created
        } catch (err) {
          throw err
        }
      }

      try {
        const created = await client.create(task)
        return created
      } catch (err) {
        throw err
      }
    },
    [client, runSetup, currentUser],
  )

  const operations: TaskOperations = useMemo(
    () => ({
      create: handleCreate,
      // TODO: Remove eslint-disable once implemented
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
      edit: async (id: string, task: TaskEditPayload) => {},
      // TODO: Remove eslint-disable once implemented
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
      remove: async (id: string) => {},
      // TODO: Remove eslint-disable once implemented
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
      update: async (id: string, task: Partial<TaskCreatePayload>) => {},
    }),
    [handleCreate],
  )
  return operations
}
