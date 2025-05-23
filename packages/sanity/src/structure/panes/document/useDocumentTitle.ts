import {type SanityDocument} from '@sanity/client'
import {unstable_useValuePreview as useValuePreview, useTranslation} from 'sanity'

import {structureLocaleNamespace} from '../../i18n'
import {useDocumentPane} from './useDocumentPane'

/**
 * useDocumentTitle hook return type.
 *
 * @beta
 * @hidden
 */
interface UseDocumentTitle {
  error?: string
  title?: string
}

/**
 * React hook that returns the document title for the current document in the document pane.
 *
 * @beta
 * @hidden
 *
 * @returns The document title or error. See {@link UseDocumentTitle}
 */
export function useDocumentTitle(): UseDocumentTitle {
  const {connectionState, schemaType, title, displayed} = useDocumentPane()
  const {t} = useTranslation(structureLocaleNamespace)
  const subscribed = Boolean(displayed)

  const {error, value} = useValuePreview({
    enabled: subscribed,
    schemaType,
    value: displayed,
  })

  if (connectionState === 'connecting' && !subscribed) {
    return {error: undefined, title: undefined}
  }

  if (title) {
    return {error: undefined, title}
  }

  if (!displayed) {
    return {
      error: undefined,
      title: t('panes.document-header-title.new.text', {
        schemaType: schemaType?.title || schemaType?.name,
      }),
    }
  }

  // in cases where the displayed document has been slated to be unpublished
  // then the displayed title should be the name of the document
  if ('_system' in displayed && (displayed as Partial<SanityDocument>)._system?.delete) {
    return {
      error: undefined,
      title: (displayed as Partial<SanityDocument>).name,
    }
  }

  if (error) {
    return {
      error: t('panes.document-list-pane.error.text', {error: error.message}),
      title: undefined,
    }
  }

  return {error: undefined, title: value?.title}
}
