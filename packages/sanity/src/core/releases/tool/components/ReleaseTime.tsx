import {useTranslation} from '../../../i18n'
import {useReleaseTime} from '../../hooks/useReleaseTime'
import {type TableRelease} from '../overview/ReleasesOverview'

export const ReleaseTime: React.FC<{release: TableRelease}> = ({release}) => {
  const {t} = useTranslation()
  const getReleaseTime = useReleaseTime()

  const {metadata} = release

  if (metadata.releaseType === 'asap') {
    return t('release.type.asap')
  }
  if (metadata.releaseType === 'undecided') {
    return t('release.type.undecided')
  }

  return getReleaseTime(release)
}
