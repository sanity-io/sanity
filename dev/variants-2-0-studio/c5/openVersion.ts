import {useCallback} from 'react'
import {useRouter} from 'sanity/router'

/**
 * Opens a document at one stored version: the structure pane for the document, with the sticky `perspective` (published,
 * drafts or a release id) and `variant` params set, which the shipped DocumentPerspectiveProvider reads. One function for
 * every entry point (lens rows, Variants tool rows through the shipped link, inventory rows, the Visitor lens), so they
 * all land the same way. A base version passes `variantId = null`.
 */
export function useOpenVersion() {
  const router = useRouter()
  return useCallback(
    (docId: string, docType: string, variantId: string | null, bundle: string) => {
      const query = `perspective=${encodeURIComponent(bundle)}${variantId ? `&variant=${encodeURIComponent(variantId)}` : ''}`
      router.navigateUrl({path: `/structure/${docType};${encodeURIComponent(docId)}?${query}`})
    },
    [router],
  )
}
