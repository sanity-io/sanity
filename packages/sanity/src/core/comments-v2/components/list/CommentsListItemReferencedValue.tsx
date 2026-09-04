import {toPlainText} from '@portabletext/react'
import {hues} from '@sanity/color'
import {LinkRemovedIcon} from '@sanity/icons/LinkRemoved'
import {isPortableTextTextBlock} from '@sanity/types'
import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {useMemo} from 'react'
import {Text, Box, Flex, Icon} from 'ui5'

import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {COMMENTS_HIGHLIGHT_HUE_KEY} from '../../constants'
import {commentsLocaleNamespace} from '../../i18n'
import {type CommentDocument} from '../../types'
import {
  blockQuoteBorderColorVar,
  blockQuoteStack,
  inlineBox,
} from './CommentsListItemReferencedValue.css'

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
  const tooltipText = t('list-item.missing-referenced-value-tooltip-content')
  const {color} = useThemeV2()
  const isDark = color._dark
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
    <Flex
      className={blockQuoteStack}
      style={assignInlineVars({[blockQuoteBorderColorVar]: borderColor})}
      data-testid="comments-list-item-referenced-value"
      flexBasis="0%"
      flexGrow={1}
      flexDirection="column"
      as="blockquote"
      padding={1}
      paddingLeft={2}
    >
      <Flex alignItems="flex-start">
        <Text size={1} muted as="div" trim={true}>
          {!hasReferencedValue && (
            <Tooltip content={tooltipText}>
              <Box className={inlineBox} marginLeft={1} marginRight={2}>
                <Icon size={1} icon={LinkRemovedIcon} style={{margin: '-0.375rem'}} />
              </Box>
            </Tooltip>
          )}

          {resolvedValue}
        </Text>
      </Flex>
    </Flex>
  )
}
