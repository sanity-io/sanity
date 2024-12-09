import {unstable_useValuePreview as useValuePreview} from 'sanity'

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
    return {error: undefined, title: `New ${schemaType?.title || schemaType?.name}`}
  }

  if (error) {
    return {error: `Error: ${error.message}`, title: undefined}
  }

  return {error: undefined, title: value?.title}
}
