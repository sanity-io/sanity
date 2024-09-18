import {ErrorOutlineIcon} from '@sanity/icons'
import {Stack, Text} from '@sanity/ui'
import {isDraftId, useTranslation} from 'sanity'

import {structureLocaleNamespace} from '../../../../i18n'
import {useDocumentPane} from '../../useDocumentPane'
import {Banner} from './Banner'

export function DraftLiveEditBanner(): JSX.Element | null {
  const {displayed} = useDocumentPane()
  const {t} = useTranslation(structureLocaleNamespace)

  if (displayed && displayed._id && !isDraftId(displayed._id)) {
    return null
  }

  return (
    <Banner
      content={
        <Stack space={2}>
          <Text size={1} weight="medium">
            {t('banners.live-edit-draft-banner.text')}
          </Text>
          <Text size={1} weight="medium">
            {t('banners.live-edit-draft-banner.explanation')}
          </Text>
        </Stack>
      }
      data-testid="live-edit-type-banner"
      icon={ErrorOutlineIcon}
    />
  )
}
