import {EarthAmericasIcon} from '@sanity/icons'
import {Box} from '@sanity/ui'

import {Button, Tooltip} from '../../../../ui-components'
import useDialogTimeZone from '../../hooks/useDialogTimeZone'
import useTimeZone from '../../hooks/useTimeZone'

export interface ButtonTimeZoneProps {
  useElementQueries?: boolean
}

const ButtonTimeZone = (props: ButtonTimeZoneProps) => {
  const {useElementQueries} = props

  const {timeZone} = useTimeZone()
  const {DialogTimeZone, dialogProps, dialogTimeZoneShow} = useDialogTimeZone()

  return (
    <>
      {/* Dialog */}
      {DialogTimeZone && <DialogTimeZone {...dialogProps} />}

      <Tooltip
        content={`Displaying schedules in ${timeZone.alternativeName} (GMT${timeZone.offset})`}
        portal
      >
        <div>
          {/*
          If `useElementQueries` is enabled, dates will be conditionally toggled at different element
          breakpoints - provided this `<ButtonTimeZone>` is wrapped in a `<ButtonTimeZoneElementQuery>` component.
        */}
          {useElementQueries ? (
            <>
              <Box className="button-small">
                <Button
                  icon={EarthAmericasIcon}
                  mode="bleed"
                  onClick={dialogTimeZoneShow}
                  text={`${timeZone.abbreviation}`}
                />
              </Box>
              <Box className="button-large">
                <Button
                  icon={EarthAmericasIcon}
                  mode="bleed"
                  onClick={dialogTimeZoneShow}
                  text={`${timeZone.alternativeName} (${timeZone.namePretty})`}
                />
              </Box>
            </>
          ) : (
            <Button
              icon={EarthAmericasIcon}
              mode="bleed"
              onClick={dialogTimeZoneShow}
              text={`${timeZone.alternativeName} (${timeZone.namePretty})`}
            />
          )}
        </div>
      </Tooltip>
    </>
  )
}

export default ButtonTimeZone
