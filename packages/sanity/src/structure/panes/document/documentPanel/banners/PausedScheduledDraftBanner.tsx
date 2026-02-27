import {PauseIcon} from '@sanity/icons'
import {Text} from '@sanity/ui'
import {Translate, useTranslation} from 'sanity'

import {structureLocaleNamespace} from '../../../../i18n'
import {Banner} from './Banner'

export function PausedScheduledDraftBanner(): React.JSX.Element {
  const {t} = useTranslation(structureLocaleNamespace)

  return (
    <Banner
      tone="caution"
      icon={PauseIcon}
      content={
        <Text size={1}>
          <Translate t={t} i18nKey="banners.paused-scheduled-draft.text" />
        </Text>
      }
    />
  )
}
