import {toPlainText} from '@portabletext/react'
import {hues} from '@sanity/color'
import {LinkRemovedIcon} from '@sanity/icons/LinkRemoved'
import {isPortableTextTextBlock} from '@sanity/types'
import {type Theme} from '@sanity/ui'
import {useMemo} from 'react'
import {css, styled} from 'styled-components'
import {Text, Box, Flex} from 'ui5'

import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {COMMENTS_HIGHLIGHT_HUE_KEY} from '../../constants'
import {commentsLocaleNamespace} from '../../i18n'
import {type CommentDocument} from '../../types'

function truncate(str: string, length = 250) {
  if (str.length <= length) return str
  return `${str.slice(0, length)}...`
}

interface BlockQuoteStackProps {
  $hasReferencedValue: boolean
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  theme: Theme
}

const InlineBox = styled(Box).attrs({marginLeft: 1, marginRight: 2})`
  &:not([data-hidden]) {
    display: inline;
  }
`

const BlockQuoteStack = styled(Flex)<BlockQuoteStackProps>(({theme, $hasReferencedValue}) => {
  const isDark = theme.sanity.v2?.color._dark

  const hue = $hasReferencedValue ? COMMENTS_HIGHLIGHT_HUE_KEY : 'gray'
  const borderColor = isDark ? hues[hue][700].hex : hues[hue][300].hex

  return css`
    border-left: 2px solid ${borderColor};
    word-break: break-word;
  `
})

interface CommentsListItemReferencedValueProps {
  hasReferencedValue: boolean | undefined
  value: CommentDocument['contentSnapshot']
}

export function CommentsListItemReferencedValue(props: CommentsListItemReferencedValueProps) {
  const {hasReferencedValue, value} = props

  const {t} = useTranslation(commentsLocaleNamespace)
  const tooltipText = t('list-item.missing-referenced-value-tooltip-content')

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
    <BlockQuoteStack
      $hasReferencedValue={Boolean(hasReferencedValue)}
      data-testid="comments-list-item-referenced-value"
      flexBasis="0%"
      flexGrow={1}
      flexDirection="column"
      forwardedAs="blockquote"
      padding={1}
      paddingLeft={2}
    >
      <Flex alignItems="flex-start">
        <Text size={1} muted as="div" trim={true}>
          {!hasReferencedValue && (
            <Tooltip content={tooltipText}>
              <InlineBox>
                <LinkRemovedIcon />
              </InlineBox>
            </Tooltip>
          )}

          {resolvedValue}
        </Text>
      </Flex>
    </BlockQuoteStack>
  )
}
