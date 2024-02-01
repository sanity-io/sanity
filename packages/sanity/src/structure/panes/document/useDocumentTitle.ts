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
 * React hook that returns the _preview_ title for the current document in the document pane
 * based off the current `formState` value.
 *
 * @beta
 * @hidden
 *
 * @returns The document title or error. See {@link UseDocumentTitle}
 */
export function useDocumentTitle(): UseDocumentTitle {
  const {connectionState, formState, schemaType} = useDocumentPane()
  const formStateValue = formState?.value

  const subscribed = Boolean(formStateValue) && connectionState === 'connected'

  const {error, value} = useValuePreview({
    enabled: subscribed,
    schemaType,
    value: formStateValue,
  })

  // Don't return a title if unable to retrieve the current preview
  // or if the `formState` value doesn't contain `_updatedAt` - indicating
  // that the current `formState` represents a newly created document.
  if (connectionState !== 'connected' || !formStateValue?._updatedAt) {
    return {
      error: undefined,
      title: undefined,
    }
  }

  if (error) {
    return {error: `Error: ${error.message}`, title: undefined}
  }

  return {error: undefined, title: value?.title}
}
