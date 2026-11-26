import {useTranslation} from '../i18n/hooks/useTranslation'
import {useConditionalToast} from './useConditionalToast'
import {useDocumentVisible} from './useDocumentVisible'

/**
 * Will show a toast telling the user that the Studio is offline and currently reconnecting, and that
 * documents are read-only until it has
 * @internal
 * @hidden
 * @param isReconnecting -
 */
export const useReconnectingToast = (isReconnecting: boolean) => {
  const {t} = useTranslation()
  // The delay only counts while the page is visible. A connection that dropped in a background
  // tab, or that the Studio closed there on purpose (`beta.releaseBackgroundListeners`), is usually
  // back by the time it could show.
  const documentVisible = useDocumentVisible()

  useConditionalToast({
    enabled: isReconnecting && documentVisible,
    delay: 2000,
    id: 'sanity/reconnecting',
    status: 'warning',
    title: t('common.reconnecting.toast.title'),
    description: t('common.reconnecting.toast.description'),
  })
}
