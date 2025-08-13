import {EarthAmericasIcon} from '@sanity/icons'
import {Box, Inline, Text} from '@sanity/ui'
import {noop} from 'lodash'
import {type ReactNode} from 'react'

import {Button} from '../../../../ui-components/button/Button'
import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import useDialogTimeZone from '../../../hooks/useDialogTimeZone'
import {type TimeZoneScope, useTimeZone} from '../../../hooks/useTimeZone'

export interface TimeZoneButtonZoneProps {
  useElementQueries?: boolean
  timeZoneScope: TimeZoneScope
  allowTimeZoneSwitch?: boolean
  tooltipContent: ReactNode
}

export const TimeZoneButton = (props: TimeZoneButtonZoneProps) => {
  const {useElementQueries, timeZoneScope, allowTimeZoneSwitch = true, tooltipContent} = props
  const {timeZone} = useTimeZone(timeZoneScope)
  const {DialogTimeZone, dialogProps, dialogTimeZoneShow} = useDialogTimeZone(timeZoneScope)

  return (
    <>
      {/* Dialog */}
      {DialogTimeZone && <DialogTimeZone {...dialogProps} />}

      <Tooltip
        content={
          <Box flex={1} padding={1}>
            <Text size={1}>{tooltipContent}</Text>
          </Box>
        }
        portal
      >
        <div>
          {/*
          If `useElementQueries` is enabled, dates will be conditionally toggled at different element
          breakpoints - provided this `<TimeZoneButtonZone>` is wrapped in a `<TimeZoneButtonZoneElementQuery>` component.
        */}
          {useElementQueries ? (
            <>
              <Box className="button-small">
                {allowTimeZoneSwitch ? (
                  <Button
                    data-testid="timezone-button"
                    icon={EarthAmericasIcon}
                    mode="bleed"
                    readOnly={!allowTimeZoneSwitch}
                    onClick={allowTimeZoneSwitch ? dialogTimeZoneShow : noop}
                    text={`${timeZone.city}`}
                  />
                ) : (
                  <Inline space={2} padding={2}>
                    <Text weight={'medium'} size={1}>
                      <EarthAmericasIcon />
                    </Text>
                    <Text weight={'medium'} size={1}>{`${timeZone.city}`}</Text>
                  </Inline>
                )}
              </Box>
              <Box className="button-large">
                {allowTimeZoneSwitch ? (
                  <Button
                    data-testid="timezone-button"
                    icon={EarthAmericasIcon}
                    mode="bleed"
                    readOnly={!allowTimeZoneSwitch}
                    onClick={allowTimeZoneSwitch ? dialogTimeZoneShow : noop}
                    text={`${timeZone.alternativeName} (${timeZone.namePretty})`}
                  />
                ) : (
                  <Inline space={2} padding={2}>
                    <Text weight={'medium'} size={1}>
                      <EarthAmericasIcon />
                    </Text>
                    <Text
                      weight={'medium'}
                      size={1}
                    >{`${timeZone.alternativeName} (${timeZone.namePretty})`}</Text>
                  </Inline>
                )}
              </Box>
            </>
          ) : (
            <>
              {allowTimeZoneSwitch ? (
                <Button
                  icon={EarthAmericasIcon}
                  mode="bleed"
                  readOnly={!allowTimeZoneSwitch}
                  onClick={allowTimeZoneSwitch ? dialogTimeZoneShow : noop}
                  text={`${timeZone.alternativeName} (${timeZone.namePretty})`}
                />
              ) : (
                <Inline space={2} padding={2}>
                  <Text weight={'medium'} size={1}>
                    <EarthAmericasIcon />
                  </Text>
                  <Text
                    weight={'medium'}
                    size={1}
                  >{`${timeZone.alternativeName} (${timeZone.namePretty})`}</Text>
                </Inline>
              )}
            </>
          )}
        </div>
      </Tooltip>
    </>
  )
}
