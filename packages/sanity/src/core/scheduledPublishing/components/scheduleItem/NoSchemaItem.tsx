import {red} from '@sanity/color'
import {UnknownIcon} from '@sanity/icons'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {SanityDefaultPreview} from '../../../preview/components/SanityDefaultPreview'
import {scheduledPublishingNamespace} from '../../i18n'
import {type Schedule} from '../../types'
import {FallbackContextMenu} from '../scheduleContextMenu/FallbackContextMenu'
import PreviewWrapper from './PreviewWrapper'

const NoSchemaItem = ({schedule}: {schedule: Schedule}) => {
  const {t} = useTranslation(scheduledPublishingNamespace)
  return (
    <PreviewWrapper
      contextMenu={<FallbackContextMenu schedule={schedule} />}
      schedule={schedule}
      useElementQueries
    >
      <SanityDefaultPreview
        icon={UnknownIcon}
        layout="default"
        subtitle={<em>{t('schedule-preview.no-schema.subtitle')}</em>}
        title={<em style={{color: red[600].hex}}>{t('schedule-preview.no-schema.title')}</em>}
      />
    </PreviewWrapper>
  )
}

export default NoSchemaItem
