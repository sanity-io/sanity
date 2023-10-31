import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {SanityClient} from '@sanity/client'
import {CommentPostPayload} from '../../types'
import {CommentsSetupContext} from './CommentsSetupContext'
import {CommentsSetupContextValue} from './types'
import {useWorkspace, useClient, DEFAULT_STUDIO_CLIENT_OPTIONS, useFeatureEnabled} from 'sanity'

interface CommentsSetupProviderProps {
  children: React.ReactNode
}

/**
 * @beta
 * @hidden
 */
export function CommentsSetupProvider(props: CommentsSetupProviderProps) {
  const {children} = props
  const {dataset, projectId} = useWorkspace()
  const originalClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const [addonDatasetClient, setAddonDatasetClient] = useState<SanityClient | null>(null)
  const [isRunningSetup, setIsRunningSetup] = useState<boolean>(false)

  const getAddonDatasetName = useCallback(async (): Promise<string | undefined> => {
    const res = await originalClient.withConfig({apiVersion: 'vX'}).request({
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
        apiVersion: 'v2022-05-09',
        dataset: addonDatasetName,
        projectId,
        requestTagPrefix: 'sanity.studio',
        useCdn: false,
        withCredentials: true,
      })

      return client
    },
    [originalClient, projectId],
  )

  const handleRunSetup = useCallback(
    async (comment: CommentPostPayload) => {
      setIsRunningSetup(true)

      // Before running the setup, we check if the addon dataset already exists.
      // The addon dataset might already exist if another user has already run
      // the setup, but the current user has not refreshed the page yet and
      // therefore don't have a client for the addon dataset yet.
      try {
        const addonDatasetName = await getAddonDatasetName()

        if (addonDatasetName) {
          const client = handleCreateClient(addonDatasetName)
          setAddonDatasetClient(client)
          await client.create(comment)
          setIsRunningSetup(false)
          return
        }
      } catch (_) {
        // If the dataset does not exist we will get an error, but we can ignore
        // it since we will create the dataset in the next step.
      }

      try {
        // 1. Create the addon dataset
        const res = await originalClient.withConfig({apiVersion: 'vX'}).request({
          uri: `/comments/${dataset}/setup`,
          method: 'POST',
        })

        const datasetName = res?.datasetName

        // 2. We can't continue if the addon dataset name is not returned
        if (!datasetName) {
          setIsRunningSetup(false)
          return
        }

        // 3. Create a client for the addon dataset and set it in the context value
        //    so that the consumers can use it to execute comment operations and set up
        //    the real time listener for the addon dataset.
        const client = handleCreateClient(datasetName)
        setAddonDatasetClient(client)

        // 4. Create the comment
        await client.create(comment)
      } catch (err) {
        throw err
      } finally {
        setIsRunningSetup(false)
      }
    },
    [dataset, getAddonDatasetName, handleCreateClient, originalClient],
  )

  useEffect(() => {
    // On mount, we check if the addon dataset already exists. If it does, we create
    // a client for it and set it in the context value so that the consumers can use
    // it to execute comment operations and set up the real time listener for the addon
    // dataset.
    getAddonDatasetName().then((addonDatasetName) => {
      if (!addonDatasetName) return
      const client = handleCreateClient(addonDatasetName)
      setAddonDatasetClient(client)
    })
  }, [getAddonDatasetName, handleCreateClient])

  const ctxValue = useMemo(
    (): CommentsSetupContextValue => ({
      client: addonDatasetClient,
      runSetup: handleRunSetup,
      isRunningSetup,
    }),
    [addonDatasetClient, handleRunSetup, isRunningSetup],
  )

  return <CommentsSetupContext.Provider value={ctxValue}>{children}</CommentsSetupContext.Provider>
}
