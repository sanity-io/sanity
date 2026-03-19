import {toPlainText} from '@portabletext/react'
import {hues} from '@sanity/color'
import {LinkRemovedIcon} from '@sanity/icons'
import {isPortableTextTextBlock} from '@sanity/types'
import {Box, Flex, Stack, Text} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {useMemo} from 'react'

import {Tooltip} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {COMMENTS_HIGHLIGHT_HUE_KEY} from '../../constants'
import {commentsLocaleNamespace} from '../../i18n'
import {type CommentDocument} from '../../types'
import {blockQuoteStack, borderColorVar, inlineBox} from './CommentsListItemReferencedValue.css'

function truncate(str: string, length = 250) {
  if (str.length <= length) return str
  return `${str.slice(0, length)}...`
}

interface CommentsListItemReferencedValueProps {
  hasReferencedValue: boolean | undefined
  value: CommentDocument['contentSnapshot']
}

export function CommentsListItemReferencedValue(props: CommentsListItemReferencedValueProps) {
  const {hasReferencedValue, value} = props

  const {t} = useTranslation(commentsLocaleNamespace)
  const theme = useThemeV2()
  const tooltipText = t('list-item.missing-referenced-value-tooltip-content')

  const isDark = theme.color._dark
  const hue = hasReferencedValue ? COMMENTS_HIGHLIGHT_HUE_KEY : 'gray'
  const borderColor = isDark ? hues[hue][700].hex : hues[hue][300].hex

  const resolvedValue = useMemo(() => {
    if (Array.isArray(value) && value?.filter(isPortableTextTextBlock).length > 0) {
      const text = value?.map(toPlainText).join(' ')
      const truncated = truncate(text)

      return truncated
    }

    return null
  }, [value])

  if (!resolvedValue) return null

  return (
    <Stack
      className={blockQuoteStack}
      style={assignInlineVars({[borderColorVar]: borderColor})}
      data-testid="comments-list-item-referenced-value"
      flex={1}
      forwardedAs="blockquote"
      padding={1}
      paddingLeft={2}
      sizing="border"
    >
      <Flex align="flex-start">
        <Text size={1} muted>
          {!hasReferencedValue && (
            <Tooltip content={tooltipText}>
              <Box className={inlineBox} marginLeft={1} marginRight={2}>
                <LinkRemovedIcon />
              </Box>
            </Tooltip>
          )}

          {resolvedValue}
        </Text>
      </Flex>
    </Stack>
  )
}
