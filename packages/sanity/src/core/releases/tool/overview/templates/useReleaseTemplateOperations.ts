import {useCallback} from 'react'

import {useCurrentUser} from '../../../../store'
import {useAddonDataset} from '../../../../studio'
import {
  type ReleaseTemplateCreatePayload,
  type ReleaseTemplateDocument,
  type ReleaseTemplateOperations,
  type ReleaseTemplateUpdatePayload,
} from './types'

/**
 * @internal
 */
export function useReleaseTemplateOperations(): ReleaseTemplateOperations {
  const {client, createAddonDataset} = useAddonDataset()
  const currentUser = useCurrentUser()

  const handleCreate = useCallback(
    async (payload: ReleaseTemplateCreatePayload): Promise<ReleaseTemplateDocument> => {
      if (!currentUser) {
        throw new Error('No current user found. Unable to create template.')
      }

      const template = {
        ...payload,
        authorId: currentUser.id,
        _type: 'test-release-template',
        usages: 0,
      } satisfies Partial<ReleaseTemplateDocument>

      if (!client) {
        try {
          const newCreatedClient = await createAddonDataset()
          if (!newCreatedClient)
            throw new Error('No addon client found. Unable to create template.')
          const created = await newCreatedClient.create(template)
          return created
        } catch (err) {
          throw err
        }
      }

      try {
        const created = await client.create(template)
        return created
      } catch (err) {
        throw err
      }
    },
    [client, createAddonDataset, currentUser],
  )

  const handleList = useCallback(async (): Promise<ReleaseTemplateDocument[]> => {
    if (!client) {
      // If no client exists, return empty array since no templates can exist yet
      return []
    }

    try {
      const templates = await client.fetch<ReleaseTemplateDocument[]>(
        `*[_type == "test-release-template"] | order(usages desc, _createdAt desc)`,
      )
      return templates
    } catch (err) {
      throw err
    }
  }, [client])

  const handleRemove = useCallback(
    async (id: string) => {
      try {
        if (!client) {
          const newCreatedClient = await createAddonDataset()
          if (!newCreatedClient) {
            throw new Error('No addon client found. Unable to remove template.')
          }
          await newCreatedClient.delete(id)
          return
        }
        await client.delete(id)
      } catch (e) {
        throw e
      }
    },
    [client, createAddonDataset],
  )

  const handleUpdate = useCallback(
    async (payload: ReleaseTemplateUpdatePayload): Promise<ReleaseTemplateDocument> => {
      try {
        if (!client) {
          const newCreatedClient = await createAddonDataset()
          if (!newCreatedClient) {
            throw new Error('No addon client found. Unable to update template.')
          }
          const updated = await newCreatedClient
            .patch(payload._id)
            .set({
              title: payload.title,
              description: payload.description,
              selectedDocumentTypes: payload.selectedDocumentTypes,
            })
            .commit()

          return updated as ReleaseTemplateDocument
        }

        const updated = await client
          .patch(payload._id)
          .set({
            title: payload.title,
            description: payload.description,
            selectedDocumentTypes: payload.selectedDocumentTypes,
          })
          .commit()

        return updated as ReleaseTemplateDocument
      } catch (e) {
        throw e
      }
    },
    [client, createAddonDataset],
  )

  const handleIncrementUsage = useCallback(
    async (id: string) => {
      try {
        if (!client) {
          const newCreatedClient = await createAddonDataset()
          if (!newCreatedClient) {
            throw new Error('No addon client found. Unable to increment template usage.')
          }
          await newCreatedClient.patch(id).inc({usages: 1}).commit()
          return
        }
        await client.patch(id).inc({usages: 1}).commit()
      } catch (e) {
        throw e
      }
    },
    [client, createAddonDataset],
  )

  return {
    create: handleCreate,
    list: handleList,
    remove: handleRemove,
    update: handleUpdate,
    incrementUsage: handleIncrementUsage,
  }
}
