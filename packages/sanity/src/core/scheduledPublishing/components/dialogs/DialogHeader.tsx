import {Box, Flex} from '@sanity/ui'

import {TimeZoneButton} from '../../../components/timeZone/timeZoneButton/TimeZoneButton'
import TimeZoneButtonElementQuery from '../../../components/timeZone/timeZoneButton/TimeZoneButtonElementQuery'
import {type TimeZoneScope, useTimeZone} from '../../../hooks/useTimeZone'
import {useTranslation} from '../../../i18n/hooks/useTranslation'

interface Props {
  title: string
  timeZoneScope: TimeZoneScope
}

const DialogHeader = (props: Props) => {
  const {title, timeZoneScope} = props
  const {timeZone} = useTimeZone(timeZoneScope)
  const {t} = useTranslation()
  return (
    <TimeZoneButtonElementQuery>
      <Flex align="center">
        {title}
        {/*
        HACK: Sanity UI will attempt to focus the first 'focusable' descendant of any dialog.
        Typically this is fine, but since our first focusable element is a button with a tooltip, this
        default behaviour causes the tooltip to appear whenever the dialog is opened, which we don't want!

        To get around this, we include a pseudo-hidden input to ensure our tooltip-enabled button remains
        unfocused on initial mount.
        */}
        <input style={{opacity: 0, position: 'absolute', width: 0}} tabIndex={-1} type="button" />
        <Box marginLeft={2} style={{marginTop: '-1em', marginBottom: '-1em'}}>
          <TimeZoneButton
            tooltipContent={t('time-zone.time-zone-tooltip-scheduled-publishing', {
              alternativeName: timeZone.alternativeName,
              offset: timeZone.offset,
            })}
            timeZoneScope={timeZoneScope}
            useElementQueries
          />
        </Box>
      </Flex>
    </TimeZoneButtonElementQuery>
  )
}

export default DialogHeader
