import {toPlainText} from '@portabletext/react'
import {hues} from '@sanity/color'
import {isPortableTextTextBlock} from '@sanity/types'
import {Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'
import styled, {css} from 'styled-components'

import {COMMENTS_HIGHLIGHT_HUE_KEY} from '../../constants'
import {type CommentDocument} from '../../types'

function truncate(str: string, length = 250) {
  if (str.length <= length) return str
  return `${str.slice(0, length)}...`
}

const BlockQuoteStack = styled(Stack)(({theme}) => {
  const isDark = theme.sanity.v2?.color._dark

  const borderColor = isDark
    ? hues[COMMENTS_HIGHLIGHT_HUE_KEY][700].hex
    : hues[COMMENTS_HIGHLIGHT_HUE_KEY][300].hex

  return css`
    border-left: 2px solid ${borderColor};
    word-break: break-word;
  `
})

interface CommentsListItemReferencedValueProps {
  value: CommentDocument['contentSnapshot']
}

export function CommentsListItemReferencedValue(props: CommentsListItemReferencedValueProps) {
  const {value} = props

  const resolvedValue = useMemo(() => {
    if (Array.isArray(value) && value?.filter(isPortableTextTextBlock)) {
      const text = value?.map(toPlainText).join(' ')
      const truncated = truncate(text)

      return (
        <Text size={1} muted>
          {truncated}
        </Text>
      )
    }

    return null
  }, [value])

  if (!resolvedValue) return null

  return (
    <BlockQuoteStack flex={1} forwardedAs="blockquote" padding={1} paddingLeft={2} sizing="border">
      {resolvedValue}
    </BlockQuoteStack>
  )
}
