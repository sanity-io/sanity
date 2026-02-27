import {useMemo} from 'react'
import {useInitialValue, useTemplates, useUnique} from 'sanity'

import {type PaneRouterContextValue, usePaneRouter} from '../../components'
import {type DocumentPaneNode} from '../../types'
import {getInitialValueTemplateOpts} from './getInitialValueTemplateOpts'

export const useDocumentPaneInitialValue = ({
  paneOptions,
  documentType,
  documentId,
  params,
}: {
  paneOptions: DocumentPaneNode['options']
  documentType: string
  documentId: string
  params: NonNullable<PaneRouterContextValue['params']>
}) => {
  const templates = useTemplates()
  const paneRouter = usePaneRouter()
  const panePayload = useUnique(paneRouter.payload)

  const {templateName, templateParams} = useMemo(
    () =>
      getInitialValueTemplateOpts(templates, {
        documentType,
        templateName: paneOptions.template,
        templateParams: paneOptions.templateParameters,
        panePayload,
        urlTemplate: params.template,
      }),
    [documentType, paneOptions, params.template, panePayload, templates],
  )

  const initialValueRaw = useInitialValue({
    documentId,
    documentType,
    templateName,
    templateParams,
    version: params.version,
  })

  const initialValue = useUnique(initialValueRaw)
  return initialValue
}
