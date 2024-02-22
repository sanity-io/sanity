import {Box, Text} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import styled from 'styled-components'

const RedText = styled(Text)((props) => {
  const {color} = getTheme_v2(props.theme)
  return `
      color: ${color.avatar.red.bg};
    `
})

export function WarningText({children}: {children: React.ReactNode}) {
  return (
    <Box paddingY={2} paddingLeft={1}>
      <RedText size={0}>{children}</RedText>
    </Box>
  )
}
