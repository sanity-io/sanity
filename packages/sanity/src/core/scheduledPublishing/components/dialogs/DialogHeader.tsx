import {Box, Flex} from '@sanity/ui'

import ButtonTimeZone from '../timeZoneButton/TimeZoneButton'
import ButtonTimeZoneElementQuery from '../timeZoneButton/TimeZoneButtonElementQuery'

interface Props {
  title: string
}

const DialogHeader = (props: Props) => {
  const {title} = props
  return (
    <ButtonTimeZoneElementQuery>
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
          <ButtonTimeZone useElementQueries />
        </Box>
      </Flex>
    </ButtonTimeZoneElementQuery>
  )
}

export default DialogHeader
