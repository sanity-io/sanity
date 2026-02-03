import {WarningOutlineIcon} from '@sanity/icons'
import {Flex, Text} from '@sanity/ui'

import {ToneIcon} from '../../../../../ui-components/toneIcon/ToneIcon'
import {Tooltip} from '../../../../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../../../../i18n'
import {releasesLocaleNamespace} from '../../../i18n'
import {getIsScheduledDateInPast} from '../../../util/getIsScheduledDateInPast'
import {type VisibleColumn} from '../../components/Table/types'
import {type TableRelease} from '../ReleasesOverview'

export const ScheduledDraftWarningCell: VisibleColumn<TableRelease>['cell'] = ({
  datum,
  cellProps,
}) => {
  const {t} = useTranslation(releasesLocaleNamespace)
  const hasWarning = datum.state === 'active' && getIsScheduledDateInPast(datum)

  return (
    <Flex
      {...cellProps}
      align="center"
      gap={2}
      paddingX={2}
      paddingY={3}
      sizing="border"
      data-testid="warning-indicator"
    >
      {hasWarning && (
        <Tooltip content={<Text size={1}>{t('passed-intended-publish-date-draft')}</Text>} portal>
          <Text size={1}>
            <ToneIcon icon={WarningOutlineIcon} tone="caution" />
          </Text>
        </Tooltip>
      )}
    </Flex>
  )
}
