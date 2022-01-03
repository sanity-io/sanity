import {useDatastores} from '@sanity/base'
import {isString} from '@sanity/base/util'
import {Box, Card, Flex, Spinner, Text} from '@sanity/ui'
import React, {useEffect, useState} from 'react'
import {DocumentNodeResolver, useStructure} from '@sanity/base/structure'
import {useDeskTool} from '../../contexts/deskTool'
import {RouterPanes} from '../../types'
import {resolveIntent} from '../../structure/resolveIntent'
import {useUnique} from '../../utils/useUnique'
import {Delay} from '../Delay'
import {Redirect} from './Redirect'
import {ensureDocumentIdAndType} from './utils'

export interface IntentResolverProps {
  intent: string
  params: Record<string, unknown> // {type: string; id: string; [key: string]: string | undefined}
  payload: unknown
  resolveDocumentNode: DocumentNodeResolver
}

/**
 * A component that receives an intent from props and redirects to the resolved
 * intent location (while showing a loading spinner during the process)
 */
export function IntentResolver(props: IntentResolverProps) {
  const {intent, params: paramsProp = {}, payload: payloadProp, resolveDocumentNode} = props
  const {builder: structureBuilder} = useStructure()
  const {structure} = useDeskTool()
  const {documentStore} = useDatastores()
  const params = useUnique(paramsProp)
  const payload = useUnique(payloadProp)
  const [nextRouterPanes, setNextRouterPanes] = useState<RouterPanes | null>(null)
  const [error, setError] = useState<unknown>(null)
  const idParam = isString(params.id) ? params.id : undefined
  const typeParam = isString(params.type) ? params.type : undefined

  useEffect(() => {
    const cancelledRef = {current: false}

    async function getNextRouterPanes() {
      const {id, type} = await ensureDocumentIdAndType(documentStore, idParam, typeParam)

      return resolveIntent(structureBuilder, resolveDocumentNode, {
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
  }, [documentStore, idParam, intent, params, payload, resolveDocumentNode, structure, typeParam])

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
