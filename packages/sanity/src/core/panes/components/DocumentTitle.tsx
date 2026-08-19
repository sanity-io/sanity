import {type ObjectSchemaType, type SanityDocument} from '@sanity/types'
import {useEffect} from 'react'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {structureLocaleNamespace} from '../../i18n/localeNamespaces'
import {useValuePreview} from '../../preview/useValuePreview'
import {useConstructDocumentTitle} from './useConstructDocumentTitle'

/**
 * Sets the browser tab title (`document.title`) to the resolved title of the
 * displayed document, suffixed with the base title of the current source.
 *
 * @internal
 */
export const DocumentTitle = ({
  isDeleted,
  displayed,
  ready,
  schemaType,
}: {
  isDeleted: boolean
  displayed: Partial<SanityDocument>
  ready: boolean
  schemaType: ObjectSchemaType | undefined
}) => {
  const {t} = useTranslation(structureLocaleNamespace)
  const isNewDocument = !displayed?._createdAt
  const {value, isLoading: previewValueIsLoading} = useValuePreview({
    enabled: !!displayed,
    schemaType,
    value: displayed,
  })

  // if the document is deleted, we don't want to show the title
  const documentTitle = isDeleted
    ? ''
    : isNewDocument
      ? t('browser-document-title.new-document', {
          schemaType: schemaType?.title || schemaType?.name,
        })
      : value?.title || t('browser-document-title.untitled-document')

  const newTitle = useConstructDocumentTitle(documentTitle)
  useEffect(() => {
    if (!ready || previewValueIsLoading) return
    // Set the title as the document title
    document.title = newTitle
  }, [documentTitle, ready, newTitle, previewValueIsLoading])

  return null
}
