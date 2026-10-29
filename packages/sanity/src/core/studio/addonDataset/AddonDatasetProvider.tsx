import {isHttpError, type SanityClient} from '@sanity/client'
import {useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {AddonDatasetContext} from 'sanity/_singletons'

import {useClient} from '../../hooks/useClient'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {useWorkspace} from '../workspace'
import {type AddonDatasetContextValue} from './types'

interface AddonDatasetSetupProviderProps {
  children: React.ReactNode
}

const LISTING_POLL_INTERVAL_MS = 1_000
const LISTING_POLL_ATTEMPTS = 30

/**
 * Whether the API rejected a setup because the dataset already has an add-on dataset. It reports
 * that as a 400 without an error code, whose message says that the number of datasets with the
 * dataset profile `comments` for the dataset would exceed the limit of 1.
 */
function isAddonDatasetLimitError(err: unknown): boolean {
  return (
    isHttpError(err) &&
    err.statusCode === 400 &&
    /dataset profile "comments".* would exceed the limit/.test(err.message)
  )
}

/**
 * Checks up to `attempts` times, {@link LISTING_POLL_INTERVAL_MS} apart, whether the add-on dataset
 * is listed, and resolves with its name once it is.
 */
async function waitForAddonDatasetListing(
  getAddonDatasetName: () => Promise<string | undefined>,
  attempts: number,
): Promise<string | undefined> {
  if (attempts === 0) return undefined
  await new Promise((resolve) => setTimeout(resolve, LISTING_POLL_INTERVAL_MS))
  const addonDatasetName = await getAddonDatasetName().catch(() => undefined)
  if (addonDatasetName) return addonDatasetName
  return waitForAddonDatasetListing(getAddonDatasetName, attempts - 1)
}

/**
 * Sets up the add-on dataset of `dataset` and resolves with its name.
 *
 * Of the setups that run at the same time, as when several studios open the tasks form of a dataset
 * that has no add-on dataset yet, the API lets one through and rejects the others right away (see
 * {@link isAddonDatasetLimitError}), while it lists the add-on dataset only once the setup it let
 * through has finished, several seconds later. A rejected setup therefore waits for the add-on
 * dataset to be listed.
 */
async function setUpAddonDataset(
  client: SanityClient,
  dataset: string,
  getAddonDatasetName: () => Promise<string | undefined>,
): Promise<string | undefined> {
  try {
    const res = await client.request<{datasetName?: string} | undefined>({
      url: `/comments/${dataset}/setup`,
      method: 'POST',
    })
    return res?.datasetName
  } catch (err) {
    if (!isAddonDatasetLimitError(err)) throw err
    const addonDatasetName = await waitForAddonDatasetListing(
      getAddonDatasetName,
      LISTING_POLL_ATTEMPTS,
    )
    if (!addonDatasetName) throw err
    return addonDatasetName
  }
}

function AddonDatasetProviderInner(props: AddonDatasetSetupProviderProps) {
  const {children} = props
  const {dataset, projectId} = useWorkspace()
  const originalClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const [addonDatasetClient, setAddonDatasetClient] = useState<SanityClient | null>(null)
  const [isCreatingDataset, setIsCreatingDataset] = useState<boolean>(false)
  const [ready, setReady] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const getAddonDatasetName = useCallback(async (): Promise<string | undefined> => {
    const res = await originalClient.request({
      url: `/projects/${projectId}/datasets?datasetProfile=comments&addonFor=${dataset}`,
      tag: 'sanity.studio',
    })

    // The response is an array containing the addon dataset. We only expect
    // one addon dataset to be returned, so we return the name of the first
    // addon dataset in the array.
    return res?.[0]?.name
  }, [dataset, originalClient, projectId])

  const handleCreateClient = useCallback(
    (addonDatasetName: string) => {
      const client = originalClient.withConfig({
        dataset: addonDatasetName,
        projectId,
        requestTagPrefix: 'sanity.studio',
        useCdn: false,
      })

      return client
    },
    [originalClient, projectId],
  )

  const handleCreateAddonDataset = useCallback(async (): Promise<SanityClient | null> => {
    setIsCreatingDataset(true)

    // Before running the setup, we check if the addon dataset already exists.
    // The addon dataset might already exist if another user has already run
    // the setup, but the current user has not refreshed the page yet and
    // therefore don't have a client for the addon dataset yet.
    try {
      const addonDatasetName = await getAddonDatasetName()

      if (addonDatasetName) {
        const client = handleCreateClient(addonDatasetName)
        setAddonDatasetClient(client)
        setIsCreatingDataset(false)
        return client
      }
    } catch {
      // If the dataset does not exist we will get an error, but we can ignore
      // it since we will create the dataset in the next step.
    }

    // Workaround for React Compiler not yet fully supporting try/catch/finally syntax
    const run = async () => {
      // 1. Create the addon dataset
      const datasetName = await setUpAddonDataset(originalClient, dataset, getAddonDatasetName)

      // 2. We can't continue if the addon dataset name is not returned
      if (!datasetName) {
        setIsCreatingDataset(false)
        return null
      }

      // 3. Create a client for the addon dataset and set it in the context value
      //    so that the consumers can use it to execute comment operations and set up
      //    the real time listener for the addon dataset.
      const client = handleCreateClient(datasetName)
      setAddonDatasetClient(client)

      // 4. Return the client so that the caller can use it to execute operations
      return client
    }
    return run().finally(() => {
      setIsCreatingDataset(false)
    })
  }, [dataset, getAddonDatasetName, handleCreateClient, originalClient])

  useEffect(() => {
    // On mount, we check if the addon dataset already exists. If it does, we create
    // a client for it and set it in the context value so that the consumers can use
    // it to execute comment operations and set up the real time listener for the addon
    // dataset.
    getAddonDatasetName()
      .then((addonDatasetName) => {
        if (!addonDatasetName) return
        const client = handleCreateClient(addonDatasetName)
        setAddonDatasetClient(client)
      })
      .catch((err) => {
        // If the addon dataset does not exist or we don't have permission to access it,
        // We can ignore this error.
        setError(err)
      })
      .finally(() => {
        setReady(true)
      })
  }, [getAddonDatasetName, handleCreateClient])

  const ctxValue = useMemo(
    (): AddonDatasetContextValue => ({
      client: addonDatasetClient,
      createAddonDataset: handleCreateAddonDataset,
      isCreatingDataset,
      ready,
      error,
    }),
    [addonDatasetClient, error, handleCreateAddonDataset, isCreatingDataset, ready],
  )

  return <AddonDatasetContext.Provider value={ctxValue}>{children}</AddonDatasetContext.Provider>
}

/**
 * This provider sets the addon dataset client, currently called `comments` dataset.
 * It also exposes a `createAddonDataset` function that can be used to create the addon dataset if it does not exist.
 * @beta
 * @hidden
 */
export function AddonDatasetProvider(props: AddonDatasetSetupProviderProps) {
  const context = useContext(AddonDatasetContext)
  // Avoid mounting the provider if it's already provided by a parent
  if (context) return props.children
  return <AddonDatasetProviderInner {...props} />
}
