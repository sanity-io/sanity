import {useContext} from 'react'
import {LoggedOutReasonContext} from 'sanity/_singletons'

import {useConditionalToast} from '../../hooks/useConditionalToast'
import {useTranslation} from '../../i18n'

/**
 * Shows a toast explaining why the studio logged the user out, when present.
 * Rendered on the auth screen rather than at the moment of the 401: by the
 * time the login screen mounts the forced-logout teardown has settled, so the
 * toast lands on a stable tree (pushing it mid-teardown gets lost).
 *
 * Backed by `useConditionalToast`, so it stays up while a logged-out reason is
 * present and is dismissed when that clears — including when the user signs
 * back in (here or in another tab, which clears the reason cross-tab) and when
 * this component unmounts.
 *
 * @internal
 */
export function LoggedOutToast() {
  const reason = useContext(LoggedOutReasonContext)
  const {t} = useTranslation()

  useConditionalToast({
    id: 'studio-logged-out',
    enabled: Boolean(reason),
    status: 'info',
    // Let the user dismiss it manually; it otherwise stays up until the
    // logged-out reason clears (e.g. on sign-in).
    closable: true,
    title: t('login.logged-out.title'),
    description:
      reason === 'session-expired'
        ? t('login.logged-out.session-expired')
        : t('login.logged-out.generic'),
  })

  return null
}
