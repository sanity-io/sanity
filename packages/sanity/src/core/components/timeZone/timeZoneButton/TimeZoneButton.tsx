import {EarthAmericasIcon} from '@sanity/icons'
import {Box, Inline, Label} from '@sanity/ui'
import {noop} from 'lodash'
import {type ReactNode} from 'react'

import {Button, Tooltip} from '../../../../ui-components'
import {type TimeZoneScope, useTimeZone} from '../../../hooks/useTimeZone'
import useDialogTimeZone from '../../../scheduledPublishing/hooks/useDialogTimeZone'

export interface ButtonTimeZoneProps {
  useElementQueries?: boolean
  timeZoneScope: TimeZoneScope
  allowTimeZoneSwitch?: boolean
  tooltipContent: ReactNode
}

const ButtonTimeZone = (props: ButtonTimeZoneProps) => {
  const {useElementQueries, timeZoneScope, allowTimeZoneSwitch = true, tooltipContent} = props
  const {timeZone} = useTimeZone(timeZoneScope)
  const {DialogTimeZone, dialogProps, dialogTimeZoneShow} = useDialogTimeZone(timeZoneScope)

  return (
    <>
      {/* Dialog */}
      {DialogTimeZone && <DialogTimeZone {...dialogProps} />}

      <Tooltip content={tooltipContent} portal>
        <div>
          {/*
          If `useElementQueries` is enabled, dates will be conditionally toggled at different element
          breakpoints - provided this `<ButtonTimeZone>` is wrapped in a `<ButtonTimeZoneElementQuery>` component.
        */}
          {useElementQueries ? (
            <>
              <Box className="button-small">
                {allowTimeZoneSwitch ? (
                  <Button
                    icon={EarthAmericasIcon}
                    mode="bleed"
                    readOnly={!allowTimeZoneSwitch}
                    onClick={allowTimeZoneSwitch ? dialogTimeZoneShow : noop}
                    text={`${timeZone.abbreviation}`}
                  />
                ) : (
                  <Inline space={2} paddingLeft={2}>
                    <Label size={4}>
                      <EarthAmericasIcon />
                    </Label>
                    <Label size={4}>{`${timeZone.abbreviation}`}</Label>
                  </Inline>
                )}
              </Box>
              <Box className="button-large">
                {allowTimeZoneSwitch ? (
                  <Inline space={2} paddingLeft={2}>
                    <Label size={4}>
                      <EarthAmericasIcon />
                    </Label>
                    <Label size={4}>{`${timeZone.alternativeName} (${timeZone.namePretty})`}</Label>
                  </Inline>
                ) : (
                  <Button
                    icon={EarthAmericasIcon}
                    mode="bleed"
                    readOnly={!allowTimeZoneSwitch}
                    onClick={allowTimeZoneSwitch ? dialogTimeZoneShow : noop}
                    text={`${timeZone.alternativeName} (${timeZone.namePretty})`}
                  />
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
                <Inline space={2} paddingLeft={2}>
                  <Label size={4}>
                    <EarthAmericasIcon />
                  </Label>
                  <Label size={4}>{`${timeZone.alternativeName} (${timeZone.namePretty})`}</Label>
                </Inline>
              )}
            </>
          )}
        </div>
      </Tooltip>
    </>
  )
}

export default ButtonTimeZone
