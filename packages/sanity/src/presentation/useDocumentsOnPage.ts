import {validateApiPerspective} from '@sanity/client'
import isEqual from 'fast-deep-equal'
import {type MutableRefObject, useCallback, useMemo, useRef, useState} from 'react'

import {type FrameState, type PresentationPerspective} from './types'
import {defineWarnOnce} from './util/warnOnce'

export type DocumentOnPage = {
  _id: string
  _type: string
}

type DocumentCache = Record<string, DocumentOnPage>
type KeyedDocumentCache = Record<string, DocumentCache>

const warnOnceAboutCrossDatasetReference = defineWarnOnce()

/**
 * @TODO should be refactored to an lru-cache that is keyed by the perspective, which could be an array (if it is, it should use consistent sorting),
 *       and the url path (optionally the origin too), so that swapping between perspectives and urls is fast.
 */
export function useDocumentsOnPage(
  perspective: PresentationPerspective,
  frameStateRef: MutableRefObject<FrameState>,
): [
  DocumentOnPage[],
  (key: string, perspective: PresentationPerspective, state: DocumentOnPage[]) => void,
] {
  validateApiPerspective(perspective)

  const [published, setPublished] = useState<KeyedDocumentCache>({})
  const [previewDrafts, setPreviewDrafts] = useState<KeyedDocumentCache>({})

  // Used to compare the frame url with its value when the cache was last updated
  // If the url has changed, the entire cache is replaced
  const urlRef = useRef<string | undefined>('')

  const setDocumentsOnPage = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-shadow
    (key: string, perspective: PresentationPerspective, sourceDocuments: DocumentOnPage[] = []) => {
      const documents = sourceDocuments.filter((sourceDocument) => {
        if ('_projectId' in sourceDocument && sourceDocument._projectId) {
          // eslint-disable-next-line no-warning-comments
          // @TODO Handle cross dataset references

          warnOnceAboutCrossDatasetReference(
            'Cross dataset references are not supported yet, ignoring source document',
            sourceDocument,
          )
          return false
        }
        return sourceDocument
      })

      const setCache = perspective === 'published' ? setPublished : setPreviewDrafts

      setCache((cache) => {
        // Create the `next` documents, dedupe by `_id`
        const next: Record<string, DocumentOnPage> = {}
        for (const document of documents) {
          next[document._id] = document
        }

        // If the frame url has changed, replace the entire cache with the next documents
        if (urlRef.current !== frameStateRef.current.url) {
          urlRef.current = frameStateRef.current.url
          return {[key]: next}
        }

        // If the keyed cache has changed, return the entire cache and replace the keyed part
        const prev = cache[key]
        if (!isEqual(prev, next)) {
          return {...cache, [key]: next}
        }

        // Otherwise return the entire cache as is
        return cache
      })
    },
    [frameStateRef],
  )

  const documentsOnPage = useMemo(() => {
    const keyedCache = perspective === 'published' ? published : previewDrafts
    const uniqueDocuments = Object.values(keyedCache).reduce((acc, cache) => {
      Object.values(cache).forEach((doc) => {
        acc[doc._id] = doc
      })
      return acc
    }, {})

    return Object.values(uniqueDocuments)
  }, [perspective, previewDrafts, published])

  return [documentsOnPage, setDocumentsOnPage]
}
