import {type SanityClient} from '@sanity/client'
import {useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {AddonDatasetContext} from 'sanity/_singletons'

import {useClient} from '../../hooks'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {useWorkspace} from '../workspace'
import {type AddonDatasetContextValue} from './types'

const API_VERSION = 'v2023-11-13'

interface AddonDatasetSetupProviderProps {
  children: React.ReactNode
}

function AddonDatasetProviderInner(props: AddonDatasetSetupProviderProps) {
  const {children} = props
  const {dataset, projectId} = useWorkspace()
  const originalClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const [addonDatasetClient, setAddonDatasetClient] = useState<SanityClient | null>(null)
  const [isCreatingDataset, setIsCreatingDataset] = useState<boolean>(false)
  const [ready, setReady] = useState<boolean>(false)

  const getAddonDatasetName = useCallback(async (): Promise<string | undefined> => {
    const res = await originalClient.withConfig({apiVersion: API_VERSION}).request({
      uri: `/projects/${projectId}/datasets?datasetProfile=comments&addonFor=${dataset}`,
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
        apiVersion: API_VERSION,
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
    } catch (_) {
      // If the dataset does not exist we will get an error, but we can ignore
      // it since we will create the dataset in the next step.
    }

    try {
      // 1. Create the addon dataset
      const res = await originalClient.withConfig({apiVersion: API_VERSION}).request({
        uri: `/comments/${dataset}/setup`,
        method: 'POST',
      })

      const datasetName = res?.datasetName

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
    } catch (err) {
      throw err
    } finally {
      setIsCreatingDataset(false)
    }
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
    }),
    [addonDatasetClient, handleCreateAddonDataset, isCreatingDataset, ready],
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
