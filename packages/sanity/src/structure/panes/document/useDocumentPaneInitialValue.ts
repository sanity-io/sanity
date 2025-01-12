import {type ReleaseId} from '@sanity/client'
import {useMemo} from 'react'
import {useInitialValue, useTemplates, useUnique} from 'sanity'

import {usePaneRouter} from '../../components'
import {type DocumentPaneNode} from '../../types'
import {EMPTY_PARAMS} from './constants'
import {getInitialValueTemplateOpts} from './getInitialValueTemplateOpts'

export const useDocumentPaneInitialValue = ({
  paneOptions,
  selectedReleaseId,
  documentType,
  documentId,
}: {
  paneOptions: DocumentPaneNode['options']
  selectedReleaseId: ReleaseId | undefined
  documentType: string
  documentId: string
}) => {
  const templates = useTemplates()
  const paneRouter = usePaneRouter()
  const panePayload = useUnique(paneRouter.payload)
  const params = useUnique(paneRouter.params) || EMPTY_PARAMS

  const {templateName, templateParams} = useMemo(
    () =>
      getInitialValueTemplateOpts(templates, {
        documentType,
        templateName: paneOptions.template,
        templateParams: paneOptions.templateParameters,
        panePayload,
        urlTemplate: params.template,
      }),
    [documentType, paneOptions, params, panePayload, templates],
  )
  const initialValueRaw = useInitialValue({
    documentId,
    documentType,
    templateName,
    templateParams,
    version: selectedReleaseId,
  })

  const initialValue = useUnique(initialValueRaw)
  return initialValue
}
