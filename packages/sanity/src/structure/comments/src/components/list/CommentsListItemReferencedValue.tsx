import {hues} from '@sanity/color'
import {Stack, Text} from '@sanity/ui'
import styled, {css} from 'styled-components'

function truncate(str: string, length = 250) {
  if (str.length <= length) return str
  return `${str.slice(0, length)}...`
}

const BlockQuoteStack = styled(Stack)(({theme}) => {
  const isDark = theme.sanity.v2?.color._dark

  const borderColor = isDark ? hues.yellow[700].hex : hues.yellow[300].hex

  return css`
    border-left: 2px solid ${borderColor};
  `
})

interface CommentsListItemReferencedValueProps {
  value: string
}

export function CommentsListItemReferencedValue(props: CommentsListItemReferencedValueProps) {
  const {value} = props

  return (
    <BlockQuoteStack flex={1} forwardedAs="blockquote" padding={1} paddingLeft={2} sizing="border">
      <Text size={1} muted>
        {truncate(value)}
      </Text>
    </BlockQuoteStack>
  )
}
