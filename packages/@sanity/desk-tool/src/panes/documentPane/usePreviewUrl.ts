// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {SanityDocument} from '@sanity/types'
import resolveProductionPreviewUrl from 'part:@sanity/transitional/production-preview/resolve-production-url?'
import {useMemo} from 'react'
import {useDocumentHistory} from './documentHistory'

export function usePreviewUrl(value: Partial<SanityDocument> | null): string | null {
  const {
    historyController: {revTime},
  } = useDocumentHistory()

  const rev = revTime ? revTime.id : null

  return useMemo(() => {
    if (!value || !resolveProductionPreviewUrl) {
      return null
    }

    try {
      return resolveProductionPreviewUrl(value, rev)
    } catch (error) {
      error.message = `An error was thrown while trying to get production preview url: ${error.message}`
      // eslint-disable-next-line no-console
      console.error(error)
      return null
    }
  }, [value, rev])
}
