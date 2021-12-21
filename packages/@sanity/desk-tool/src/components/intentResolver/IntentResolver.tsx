import {useDatastores} from '@sanity/base'
import {Box, Card, Flex, Spinner, Text} from '@sanity/ui'
import React, {useEffect, useState} from 'react'
import {useDeskTool} from '../../contexts/deskTool'
import {RouterPanes} from '../../types'
import {resolveIntent} from '../../utils/resolveIntent'
import {useUnique} from '../../utils/useUnique'
import {Delay} from '../Delay'
import {Redirect} from './Redirect'
import {ensureDocumentIdAndType} from './utils'

export interface IntentResolverProps {
  intent: string
  params: {type: string; id: string; [key: string]: string | undefined}
  payload: unknown
}

/**
 * A component that receives an intent from props and redirects to the resolved
 * intent location (while showing a loading spinner during the process)
 */
export function IntentResolver(props: IntentResolverProps) {
  const {intent} = props
  const {resolveDocumentNode, structure} = useDeskTool()
  const {documentStore} = useDatastores()
  const params = useUnique(props.params || {})
  const payload = useUnique(props.payload)
  const [nextRouterPanes, setNextRouterPanes] = useState<RouterPanes | null>(null)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    const cancelledRef = {current: false}

    async function getNextRouterPanes() {
      const {id, type} = await ensureDocumentIdAndType(documentStore, params.id, params.type)

      return resolveIntent(resolveDocumentNode, {
        intent,
        params: {...params, id, type},
        payload,
        rootPaneNode: structure,
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
  }, [documentStore, intent, params, payload, resolveDocumentNode, structure])

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
