import {useDocumentPane} from './useDocumentPane'
import {unstable_useValuePreview as useValuePreview} from 'sanity'

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
 * @returns The document title
 */
export function useDocumentTitle(): UseDocumentTitle {
  const {connectionState, schemaType, title, value: documentValue} = useDocumentPane()
  const subscribed = Boolean(documentValue) && connectionState === 'connected'

  const {error, value} = useValuePreview({
    enabled: subscribed,
    schemaType,
    value: documentValue,
  })

  if (connectionState !== 'connected') {
    return {error: undefined, title: undefined}
  }

  if (title) {
    return {error: undefined, title}
  }

  if (!documentValue) {
    return {error: undefined, title: `New ${schemaType?.title || schemaType?.name}`}
  }

  if (error) {
    return {error: `Error: ${error.message}`, title: undefined}
  }

  return {error: undefined, title: value?.title}
}
