// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import type {SanityDocument} from '@sanity/types'
import resolveProductionPreviewUrl from 'part:@sanity/transitional/production-preview/resolve-production-url?'
import type {Controller as HistoryController} from './documentHistory/history/Controller'

export function getPreviewUrl(
  historyController: HistoryController,
  value: Partial<SanityDocument> | null
): string | null {
  const {revTime} = historyController
  const rev = revTime ? revTime.id : null

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
}
