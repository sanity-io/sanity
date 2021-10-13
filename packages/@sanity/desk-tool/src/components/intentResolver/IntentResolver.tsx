import {Box, Card, Flex, Spinner, Text} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {getTemplateById} from '@sanity/base/initial-value-templates'
import React, {useMemo} from 'react'
import {LOADING_PANE} from '../../constants'
import {useStructure} from '../../utils/resolvePanes'
import {removeDraftPrefix, useDocumentType} from '../../lib/resolveDocumentType'
import {useUnique} from '../../lib/useUnique'
import {Delay} from '../Delay'
import {StructureError} from '../StructureError'
import {Redirect} from './Redirect'

export interface IntentResolverProps {
  intent: string
  params: {type: string; id: string; [key: string]: unknown}
  payload: unknown
}

const FALLBACK_ID = '__fallback__'

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
export const IntentResolver = React.memo(function IntentResolver({
  params,
  payload,
}: IntentResolverProps) {
  const {type: specifiedSchemaType, id, ...otherParamsNonUnique} = params || {}
  const otherParams = useUnique(otherParamsNonUnique)
  const documentId = id || FALLBACK_ID
  const {documentType, isLoaded} = useDocumentType(documentId, specifiedSchemaType)
  const paneSegments = useMemo(
    () =>
      documentType
        ? [
            [{id: documentType, params: otherParams}],
            [{id: documentId, params: otherParams, payload}],
          ]
        : undefined,
    [documentId, documentType, otherParams, payload]
  )

  const {structure, error} = useStructure(paneSegments, {silent: true})
  const isLoading = Boolean(!structure || structure.some((item) => item === LOADING_PANE))

  const panes = useMemo(() => {
    if (error) return null
    if (!documentType) return null
    if (isLoading) return null
    if (!paneSegments) return null

    const lastChild = structure[structure.length - 1] || {}
    const lastGroup = paneSegments[paneSegments.length - 1]
    const lastSibling = lastGroup[lastGroup.length - 1]
    const terminatesInDocument =
      lastChild.type === 'document' && lastChild.options.id === documentId
    const {template: isTemplateCreate, ..._otherParams} = otherParams
    const template: any = isTemplateCreate && getTemplateById(otherParams.template as any)
    const type = (template && template.schemaType) || documentType
    const fallbackParameters = {..._otherParams, type, template: otherParams.template}
    const newDocumentId = documentId === FALLBACK_ID ? uuid() : removeDraftPrefix(documentId)

    return terminatesInDocument
      ? paneSegments
          .slice(0, -1)
          .concat([lastGroup.slice(0, -1).concat({...lastSibling, id: newDocumentId})])
      : [[{id: `__edit__${newDocumentId}`, params: fallbackParameters, payload}]]
  }, [documentId, documentType, error, isLoading, otherParams, paneSegments, payload, structure])

  const nonDocumentTypePanes = useMemo(
    () => [[{id: `__edit__${id || uuid()}`, params: otherParams}]],
    [id, otherParams]
  )

  if (error) {
    return <StructureError error={error} />
  }

  if (!documentType) {
    if (isLoaded) {
      return <Redirect panes={nonDocumentTypePanes} />
    }

    return (
      <Card height="fill">
        <Delay ms={300}>
          <Flex align="center" direction="column" height="fill" justify="center">
            <Spinner muted />
            <Box marginTop={3}>
              <Text align="center" muted size={1}>
                Resolving document type…
              </Text>
            </Box>
          </Flex>
        </Delay>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card height="fill">
        <Delay ms={300}>
          <Flex align="center" direction="column" height="fill" justify="center">
            <Spinner muted />
            <Box marginTop={3}>
              <Text muted size={1}>
                Resolving structure…
              </Text>
            </Box>
          </Flex>
        </Delay>
      </Card>
    )
  }

  return panes ? <Redirect panes={panes} /> : null
})
