import {Box, Card, Flex, Spinner, Text} from '@sanity/ui'
import React, {useEffect, useState} from 'react'
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
 *
 * This is a *very naive* implementation of an intent resolver:
 * - If type is missing from params, it'll try to resolve from document
 * - It manually builds a pane segment path: "<typeName>;<documentId>"
 * - Tries to resolve that to a structure
 * - Checks if the last pane segment is an editor, and if so; is it the right type/id?
 *   - Yes: Resolves to "<typeName>;<documentId>"
 *   - No : Resolves to fallback edit pane (context-less)
 */
export function IntentResolver(props: IntentResolverProps) {
  const {intent} = props
  const params = useUnique(props.params || {})
  const payload = useUnique(props.payload)
  const [nextRouterPanes, setNextRouterPanes] = useState<RouterPanes | null>(null)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    async function getNextRouterPanes() {
      const {id, type} = await ensureDocumentIdAndType(params.id, params.type)

      return resolveIntent({
        intent,
        params: {...params, id, type},
        payload,
      })
    }

    getNextRouterPanes().then(setNextRouterPanes).catch(setError)
  }, [intent, params, payload])

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
