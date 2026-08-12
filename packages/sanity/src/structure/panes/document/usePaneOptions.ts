import {useMemo} from 'react'
import {useTemplates} from 'sanity'

import {type DocumentPaneNode} from '../../types'

type DocumentPaneOptions = DocumentPaneNode['options']

/**
 * @internal
 */
export function usePaneOptions(
  options: DocumentPaneOptions,
  params: Record<string, string | undefined> = {},
): DocumentPaneOptions {
  const templates = useTemplates()

  return useMemo(() => {
    // The document type is provided, so return
    if (options.type && options.type !== '*') {
      return options
    }

    // Attempt to derive document type from the template configuration
    const templateName = options.template || params.template
    const template = templateName ? templates.find((t) => t.id === templateName) : undefined
    const documentType = template?.schemaType

    // No document type was found in a template
    if (!documentType) {
      return options
    }

    // The template provided the document type, so modify the pane’s `options` property
    return {...options, type: documentType}
  }, [options, params.template, templates])
}
