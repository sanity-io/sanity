import {type ToastParams} from '@sanity/ui/toast'

import {type TFunction} from '../../../i18n/types'

/** @internal */
export const LISTENER_STALLED_TOAST_ID = 'document-listener-stalled'

/** @internal */
export function getListenerStalledToastParams(t: TFunction): ToastParams {
  return {
    id: LISTENER_STALLED_TOAST_ID,
    status: 'warning',
    closable: true,
    duration: 15_000,
    title: t('document-store.listener-stalled.title'),
    description: t('document-store.listener-stalled.description'),
  }
}
