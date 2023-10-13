import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {SanityClient} from '@sanity/client'
import {CommentPostPayload} from '../../types'
import {CommentsSetupContext} from './CommentsSetupContext'
import {CommentsSetupContextValue} from './types'
import {useWorkspace, useClient, DEFAULT_STUDIO_CLIENT_OPTIONS} from 'sanity'

interface CommentsClientProviderProps {
  children: React.ReactNode
}

/**
 * @beta
 * @hidden
 */
export function CommentsSetupProvider(props: CommentsClientProviderProps) {
  const {children} = props
  const {dataset, projectId} = useWorkspace()
  const originalClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const [addonDatasetClient, setAddonDatasetClient] = useState<SanityClient | null>(null)
  const [isRunningSetup, setIsRunningSetup] = useState<boolean>(false)

  const getAddonDatasetName = useCallback(async (): Promise<string | undefined> => {
    const res = await originalClient.withConfig({apiVersion: 'vX'}).request({
      uri: `/projects/${projectId}/datasets?datasetProfile=comments&addonFor=${dataset}`,
    })

    // The response is an array containing the addon dataset. We only expect
    // one addon dataset to be returned, so we return the name of the first
    // addon dataset in the array.
    return Array.isArray(res) && res[0].name ? res[0].name : undefined
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
      // todo:
      // Check if the addon dataset already exists. If it does, we create
      // a client for it and post the comment to it. The dataset might already
      // exist if user1 ran the setup and user2 has not refreshed the browser
      // and therefore not received the new dataset name from the server.

      try {
        setIsRunningSetup(true)

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
    [dataset, handleCreateClient, originalClient],
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
    () =>
      ({
        client: addonDatasetClient,
        runSetup: handleRunSetup,
        isRunningSetup,
      }) satisfies CommentsSetupContextValue,
    [addonDatasetClient, handleRunSetup, isRunningSetup],
  )

  return <CommentsSetupContext.Provider value={ctxValue}>{children}</CommentsSetupContext.Provider>
}
