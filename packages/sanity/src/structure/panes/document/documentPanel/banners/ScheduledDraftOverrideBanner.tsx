import {WarningOutlineIcon} from '@sanity/icons'
import {Text} from '@sanity/ui'
import {Translate, useTranslation} from 'sanity'

import {structureLocaleNamespace} from '../../../../i18n'
import {Banner} from './Banner'

export function ScheduledDraftOverrideBanner(): React.JSX.Element {
  const {t} = useTranslation(structureLocaleNamespace)

  return (
    <Banner
      tone="caution"
      icon={WarningOutlineIcon}
      content={
        <Text size={1}>
          <Translate t={t} i18nKey="banners.scheduled-draft-override-banner.text" />
        </Text>
      }
    />
  )
}
