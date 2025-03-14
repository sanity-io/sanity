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

export const archiveRelease = async ({
  sanityClient,
  dataset,
  releaseId,
}: {
  sanityClient: SanityClient
  dataset: string | undefined
  releaseId: string
}) => {
  try {
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
  } catch (error) {
    console.error('Error archiving release:', error)
    throw error
  }
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
  await archiveRelease({sanityClient, dataset, releaseId})
  await waitForReleaseToBeArchived({sanityClient, releaseId})
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

/**
 * This method will delete all the releases that exist within a dataset
 *
 * This is a particularly useful usecase in situations where the CI has created releases that you might not have expected
 * and it's causing the dataset to misbehave. Running this method will make sure that you can start from a clean slate.
 *
 * In can also be useful to make sure that before you run the tests that there aren't other releases already in the dataset from other tests that might interfere with your code.
 */
export const deleteAllReleases = async ({
  sanityClient,
  dataset,
}: {
  sanityClient: SanityClient
  dataset: string | undefined
}) => {
  const query = `*[_type == "system.release"]{_id}`
  const releases = await sanityClient.fetch(query)

  if (!Array.isArray(releases) || releases.length === 0) {
    console.warn('No releases found to delete.')
    return
  }

  try {
    await Promise.all(
      releases.map(async (release: {_id: string}) => {
        const releaseId = release._id.replace('_.releases.', '')
        return archiveAndDeleteRelease({sanityClient, dataset, releaseId})
      }),
    )
  } catch (error) {
    console.error('Error deleting releases:', error)
    throw error
  }
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
      const query = `*[_type == "system.release" && _id == "_.releases.${releaseId}"][0] {state}`
      const release = await sanityClient.fetch(query)

      if (!release) {
        return resolve()
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
