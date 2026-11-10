import {useTranslation} from '../i18n/hooks/useTranslation'
import {useConditionalToast} from './useConditionalToast'

/**
 * Will show a toast telling the user that the Studio is offline and currently reconnecting, and that
 * documents are read-only until it has
 * @internal
 * @hidden
 * @param isReconnecting -
 */
export const useReconnectingToast = (isReconnecting: boolean) => {
  const {t} = useTranslation()

  useConditionalToast({
    enabled: isReconnecting,
    delay: 2000,
    id: 'sanity/reconnecting',
    status: 'warning',
    title: t('common.reconnecting.toast.title'),
    description: t('common.reconnecting.toast.description'),
  })
}
