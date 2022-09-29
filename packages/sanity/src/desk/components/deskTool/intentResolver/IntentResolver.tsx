import {Box, Card, Flex, Spinner, Text} from '@sanity/ui'
import React, {useEffect, useState} from 'react'
import {resolveIntent} from '../../../structureResolvers'
import {RouterPanes} from '../../../types'
import {useDeskTool} from '../../../useDeskTool'
import {Delay} from '../../Delay'
import {Redirect} from './Redirect'
import {ensureDocumentIdAndType} from './utils'
import {useDocumentStore, useUnique} from 'sanity'

export interface IntentResolverProps {
  intent: string
  params: Record<string, unknown> // {type: string; id: string; [key: string]: string | undefined}
  payload: unknown
}

/**
 * A component that receives an intent from props and redirects to the resolved
 * intent location (while showing a loading spinner during the process)
 */
export function IntentResolver({
  intent,
  params: paramsProp = {},
  payload: payloadProp,
}: IntentResolverProps) {
  const {rootPaneNode, structureContext} = useDeskTool()
  const documentStore = useDocumentStore()
  const params = useUnique(paramsProp)
  const payload = useUnique(payloadProp)
  const [nextRouterPanes, setNextRouterPanes] = useState<RouterPanes | null>(null)
  const [error, setError] = useState<unknown>(null)
  const idParam = typeof params.id === 'string' ? params.id : undefined
  const typeParam = typeof params.type === 'string' ? params.type : undefined

  useEffect(() => {
    const cancelledRef = {current: false}

    async function getNextRouterPanes() {
      const {id, type} = await ensureDocumentIdAndType(documentStore, idParam, typeParam)

      return resolveIntent({
        intent,
        params: {...params, id, type},
        payload,
        rootPaneNode,
        structureContext,
      })
    }

    getNextRouterPanes()
      .then((result) => {
        if (!cancelledRef.current) {
          setNextRouterPanes(result)
        }
      })
      .catch(setError)

    return () => {
      cancelledRef.current = true
    }
  }, [documentStore, idParam, intent, params, payload, rootPaneNode, structureContext, typeParam])

  // throwing here bubbles the error up to the error boundary inside of the
  // `DeskToolRoot` component
  if (error) throw error
  if (nextRouterPanes) return <Redirect panes={nextRouterPanes} />

  return (
    <Card height="fill">
      <Delay ms={300}>
        <Flex align="center" direction="column" height="fill" justify="center">
          <Spinner muted />
          <Box marginTop={3}>
            <Text align="center" muted size={1}>
              Loading…
            </Text>
          </Box>
        </Flex>
      </Delay>
    </Card>
  )
}
