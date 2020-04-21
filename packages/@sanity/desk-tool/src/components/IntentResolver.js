/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable react/jsx-filename-extension */
/* eslint-disable react/no-multi-comp */
/* eslint-disable react/prop-types */

import React, {useEffect, useState} from 'react'
import {of} from 'rxjs'
import {map} from 'rxjs/operators'
import client from 'part:@sanity/base/client'
import {useRouter} from 'part:@sanity/base/router'
import Spinner from 'part:@sanity/components/loading/spinner'
import {useStructure} from '../utils/resolvePanes'
import {LOADING_PANE} from '../constants'
import StructureError from './StructureError'
import UUID from '@sanity/uuid'
import {getTemplateById} from '@sanity/base/initial-value-templates'

const FALLBACK_ID = '__fallback__'

/**
 * This is a *very naive* implementation of an intent resolver:
 * - If type is missing from params, it'lltry to resolve from document
 * - It manually builds a pane segment path: "<typeName>;<documentId>"
 * - Tries to resolve that to a structure
 * - Checks if the last pane segment is an editor, and if so; is it the right type/id?
 *   - Yes: Resolves to "<typeName>;<documentId>"
 *   - No : Resolves to fallback edit pane (context-less)
 */
// eslint-disable-next-line complexity
const IntentResolver = React.memo(function IntentResolver({params, payload}) {
  const {type: specifiedSchemaType, id, ...otherParams} = params || {}

  const documentId = id || FALLBACK_ID
  const {documentType, isLoaded} = useDocumentType(documentId, specifiedSchemaType)
  const paneSegments = documentType
    ? [[{id: documentType, params: {}}], [{id: documentId, params: otherParams, payload}]]
    : undefined

  const {structure, error} = useStructure(paneSegments, {silent: true})

  if (error) {
    return <StructureError error={error} />
  }

  if (!documentType) {
    return isLoaded ? (
      <Redirect panes={[[{id: `__edit__${id || UUID()}`, params: {}}]]} />
    ) : (
      <Spinner center message="Resolving document type…" delay={600} />
    )
  }

  const isLoading = !structure || structure.some(item => item === LOADING_PANE)
  if (isLoading) {
    return <Spinner center message="Resolving structure…" delay={600} />
  }

  const panes = getNewRouterState({
    structure,
    documentType,
    params: otherParams,
    payload,
    paneSegments,
    documentId
  })

  return <Redirect panes={panes} />
})

function getNewRouterState({structure, documentType, params, payload, documentId, paneSegments}) {
  const lastChild = structure[structure.length - 1] || {}
  const lastGroup = paneSegments[paneSegments.length - 1]
  const lastSibling = lastGroup[lastGroup.length - 1]
  const terminatesInDocument = lastChild.type === 'document' && lastChild.options.id === documentId

  const isTemplateCreate = params.template
  const template = isTemplateCreate && getTemplateById(params.template)
  const type = (template && template.schemaType) || documentType
  const fallbackParameters = {type, template: params.template}
  const newDocumentId = documentId === FALLBACK_ID ? UUID() : documentId

  return terminatesInDocument
    ? paneSegments
        .slice(0, -1)
        .concat([lastGroup.slice(0, -1).concat({...lastSibling, id: newDocumentId})])
    : [[{id: `__edit__${newDocumentId}`, params: fallbackParameters, payload}]]
}

// Navigates to passed router panes state on mount
function Redirect({panes}) {
  const router = useRouter()

  useEffect(() => {
    router.navigate({panes}, {replace: true})
  })

  return <Spinner center message="Redirecting…" delay={600} />
}

function useDocumentType(documentId, specifiedType) {
  const [{documentType, isLoaded}, setDocumentType] = useState({isLoaded: false})
  useEffect(() => {
    const sub = resolveTypeForDocument(documentId, specifiedType).subscribe(documentType =>
      setDocumentType({documentType, isLoaded: true})
    )
    return () => sub.unsubscribe()
  })
  return {documentType, isLoaded}
}

function resolveTypeForDocument(id, specifiedType) {
  if (specifiedType) {
    return of(specifiedType)
  }

  const query = '*[_id in [$documentId, $draftId]]._type'
  const documentId = id.replace(/^drafts\./, '')
  const draftId = `drafts.${documentId}`
  return client.observable.fetch(query, {documentId, draftId}).pipe(map(types => types[0]))
}

export default IntentResolver
