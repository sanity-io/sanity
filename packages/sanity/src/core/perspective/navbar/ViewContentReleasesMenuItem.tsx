import {CalendarIcon} from '@sanity/icons'
import {type ComponentType} from 'react'
import {useRouter} from 'sanity/router'

import {MenuItem} from '../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../i18n'
import {RELEASES_INTENT} from '../../releases/plugin'

export const ViewContentReleasesMenuItem: ComponentType = () => {
  const router = useRouter()
  const {t} = useTranslation()

  const releasesUrl = router.resolveIntentLink(RELEASES_INTENT, {})

  return (
    <MenuItem
      as="a"
      href={releasesUrl}
      icon={CalendarIcon}
      text={t('release.menu.view-releases')}
      data-testid="view-content-releases-menu-item"
    />
  )
}
