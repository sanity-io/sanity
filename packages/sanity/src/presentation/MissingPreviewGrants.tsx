import {useCurrentUser, useTranslation} from 'sanity'
import {Flex} from 'ui5'

import {ErrorCard} from './components/ErrorCard'
import {presentationLocaleNamespace} from './i18n'

/**
 * Replaces the preview when draft mode needs a secret this user cannot create or share.
 * The iframe is not mounted: loading it without a secret makes the frontend reject the
 * request, and the overlays timeout then reports that as a connection failure.
 */
export function MissingPreviewGrants(): React.JSX.Element {
  const {t} = useTranslation(presentationLocaleNamespace)
  const currentUser = useCurrentUser()
  const roles = currentUser?.roles
    .map((role) => role.title)
    .filter((title) => title.length > 0)
    .join(', ')

  return (
    <Flex data-testid="presentation-missing-grants" height="100%">
      <ErrorCard
        flex={1}
        message={
          roles
            ? t('preview-url-secret.missing-grants', {context: 'with-role', roles})
            : t('preview-url-secret.missing-grants')
        }
      />
    </Flex>
  )
}
