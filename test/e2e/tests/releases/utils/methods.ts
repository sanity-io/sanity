import {type SanityClient} from '@sanity/client'

export const RELEASES_STUDIO_CLIENT_OPTIONS = {
  apiVersion: 'v2025-02-19',
}

export const createRelease = async ({
  sanityClient,
  dataset,
  releaseId,
  metadata,
}: {
  sanityClient: SanityClient
  dataset: string | undefined
  releaseId: string
  metadata: Record<string, any>
}) => {
  await sanityClient.withConfig(RELEASES_STUDIO_CLIENT_OPTIONS).request({
    uri: `/data/actions/${dataset}`,
    method: 'POST',
    body: {
      actions: [
        {
          actionType: 'sanity.action.release.create',
          releaseId: releaseId,
          metadata: metadata,
        },
      ],
    },
  })
}

export const archiveRelease = async ({
  sanityClient,
  dataset,
  releaseId,
}: {
  sanityClient: SanityClient
  dataset: string | undefined
  releaseId: string
}) => {
  await sanityClient.withConfig(RELEASES_STUDIO_CLIENT_OPTIONS).request({
    uri: `/data/actions/${dataset}`,
    method: 'POST',
    body: {
      actions: [
        {
          actionType: 'sanity.action.release.archive',
          releaseId: releaseId,
        },
      ],
    },
  })
}

export const deleteRelease = async ({
  sanityClient,
  dataset,
  releaseId,
}: {
  sanityClient: SanityClient
  dataset: string | undefined
  releaseId: string
}) => {
  // delete release
  await sanityClient.withConfig(RELEASES_STUDIO_CLIENT_OPTIONS).request({
    uri: `/data/actions/${dataset}`,
    method: 'POST',
    body: {
      actions: [
        {
          actionType: 'sanity.action.release.delete',
          releaseId: releaseId,
        },
      ],
    },
  })
}

export const discardVersion = async ({
  sanityClient,
  dataset,
  versionId,
}: {
  sanityClient: SanityClient
  dataset: string | undefined
  versionId: string
}) => {
  // delete release
  await sanityClient.withConfig(RELEASES_STUDIO_CLIENT_OPTIONS).request({
    uri: `/data/actions/${dataset}`,
    method: 'POST',
    body: {
      actions: [
        {
          actionType: 'sanity.action.document.discard',
          draftId: versionId,
        },
      ],
    },
  })
}

/**
 * @returns a random string of letters and numbers (9 characters long)
 * @internal
 */
export function getRandomReleaseId() {
  return Math.random().toString(36).slice(2, 11)
}
