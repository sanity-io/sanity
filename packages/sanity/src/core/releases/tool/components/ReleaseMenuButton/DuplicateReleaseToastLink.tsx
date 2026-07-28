import {Text} from '@sanity/ui'
import {useCallback} from 'react'
import {useRouter} from 'sanity/router'

import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {releasesLocaleNamespace} from '../../../i18n'
import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
import {type ActionResult} from './ReleaseMenuButton'

export const DuplicateReleaseToastLink = ({actionResult}: {actionResult: ActionResult}) => {
  const router = useRouter()
  const {t} = useTranslation(releasesLocaleNamespace)

  const navigateToDuplicateRelease = useCallback(() => {
    if (!actionResult || !('releaseId' in actionResult)) return

    router.navigate({releaseId: getReleaseIdFromReleaseDocumentId(actionResult.releaseId)})
  }, [actionResult, router])

  return (
    <Text
      size={1}
      weight="medium"
      data-as="a"
      onClick={navigateToDuplicateRelease}
      style={{
        cursor: 'pointer',
        marginBottom: '0.5rem',
        display: 'flex',
      }}
      data-testid="duplicate-release-success-link"
    >
      {t('toast.duplicate.success-link')}
    </Text>
  )
}
