/* eslint-disable no-console */
import {type SanityClient, type SanityDocument} from '@sanity/client'

export const CLIENT_OPTIONS = {
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
  await sanityClient.withConfig(CLIENT_OPTIONS).request({
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

export const archiveRelease = ({
  sanityClient,
  dataset,
  releaseId,
}: {
  sanityClient: SanityClient
  dataset: string | undefined
  releaseId: string
}) => {
  sanityClient.withConfig(CLIENT_OPTIONS).request({
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

export const deleteRelease = ({
  sanityClient,
  dataset,
  releaseId,
}: {
  sanityClient: SanityClient
  dataset: string | undefined
  releaseId: string
}) => {
  // delete release
  sanityClient.withConfig(CLIENT_OPTIONS).request({
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

export const archiveAndDeleteRelease = async ({
  sanityClient,
  dataset,
  releaseId,
}: {
  sanityClient: SanityClient
  dataset: string | undefined
  releaseId: string
}) => {
  console.log(releaseId)
  console.log(!isArchived({sanityClient, releaseId}))
  if (!isArchived({sanityClient, releaseId})) {
    await archiveRelease({sanityClient, dataset, releaseId})

    await waitForReleaseToBeArchived({sanityClient, releaseId})
  }

  await deleteRelease({sanityClient, dataset, releaseId})
}

export const discardVersion = ({
  sanityClient,
  dataset,
  versionId,
}: {
  sanityClient: SanityClient
  dataset: string | undefined
  versionId: string
}) => {
  // discard release
  sanityClient.withConfig(CLIENT_OPTIONS).request({
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
  return Math.random().toString(36).slice(2)
}

export const createDocument = (
  sanityClient: SanityClient,
  documentMetada: Partial<SanityDocument> & {_id: string; _type: string},
) => {
  return sanityClient.withConfig(CLIENT_OPTIONS).create({
    ...documentMetada,
  })
}

/** Delete all the releases in a dataset */
export const deleteAllReleases = async ({
  sanityClient,
  dataset,
}: {
  sanityClient: SanityClient
  dataset: string | undefined
}) => {
  const query = `*[_type == "system.release"]`
  const releases = await sanityClient.fetch(query)

  await Promise.all(
    releases.map((release: {_id: string}) =>
      archiveAndDeleteRelease({
        sanityClient,
        dataset,
        releaseId: release._id.replace('_.releases.', ''),
      }),
    ),
  )
}

/**
 * Polls the Sanity release status until it is 'archived'
 */
async function waitForReleaseToBeArchived({
  sanityClient,
  releaseId,
  interval = 5000,
  timeout = 60000,
}: {
  sanityClient: SanityClient
  releaseId: string
  interval?: number
  timeout?: number
}) {
  const startTime = Date.now()

  return new Promise<void>((resolve, reject) => {
    // eslint-disable-next-line consistent-return
    const checkStatus = async () => {
      const query = `*[_type == "system.release" && _id == "_.releases.${releaseId}"][0]`
      const release = await sanityClient.fetch(query)

      if (!release) {
        return undefined
      }

      if (release.state === 'archived') {
        return resolve()
      }

      if (Date.now() - startTime >= timeout) {
        return reject(new Error(`Timed out waiting for release ${releaseId} to be archived`))
      }

      setTimeout(checkStatus, interval)
    }

    checkStatus()
  })
}

/** Checks if Sanity release status is archived */
async function isArchived({
  sanityClient,
  releaseId,
}: {
  sanityClient: SanityClient
  releaseId: string
}) {
  const query = `*[_type == "system.release" && _id == "_.releases.${releaseId}"][0]`
  const release = await sanityClient.fetch(query)

  return release.state === 'archived'
}
