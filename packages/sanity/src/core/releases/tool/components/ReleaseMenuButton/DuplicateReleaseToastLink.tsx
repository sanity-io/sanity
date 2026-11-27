import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback} from 'react'
import {useRouter} from 'sanity/router'
import {Text} from 'ui5'

import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {ReleaseDetailLinkClicked} from '../../../__telemetry__/releases.telemetry'
import {releasesLocaleNamespace} from '../../../i18n'
import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
import {type ActionResult} from './ReleaseMenuButton'

export const DuplicateReleaseToastLink = ({actionResult}: {actionResult: ActionResult}) => {
  const router = useRouter()
  const {t} = useTranslation(releasesLocaleNamespace)
  const telemetry = useTelemetry()

  const navigateToDuplicateRelease = useCallback(() => {
    if (!actionResult || !('releaseId' in actionResult)) return

    telemetry.log(ReleaseDetailLinkClicked, {location: 'duplicate_release_toast'})
    router.navigate({releaseId: getReleaseIdFromReleaseDocumentId(actionResult.releaseId)})
  }, [actionResult, router, telemetry])

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
      as="div"
      trim={true}
    >
      {t('toast.duplicate.success-link')}
    </Text>
  )
}
