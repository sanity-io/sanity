import {ArrowRightIcon, WarningOutlineIcon} from '@sanity/icons'
import {Card, Flex, rem, Text, useMediaIndex} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

import {RELEASES_DOCS_URL} from '../../constants'

/**
 * Updates the size of the icon to be used inside a Text size=1 to a Text size=0, without having to add a new
 * Text element, allowing to sit inline in the same anchor element.
 */
const SmallIcon = styled(ArrowRightIcon)((props) => {
  const {font} = getTheme_v2(props.theme)
  const {ascenderHeight, descenderHeight, lineHeight, iconSize} = font.text.sizes[0]
  const negHeight = ascenderHeight + descenderHeight
  const capHeight = lineHeight - negHeight
  const iconOffset = (capHeight - iconSize) / 2

  return css`
    &[data-sanity-icon] {
      color: var(--card-link-color);
      font-size: calc(${iconSize} / 16 * 1rem);
      margin: ${rem(iconOffset)};
      margin-bottom: ${rem(iconOffset)};
    }
  `
})

export function WarningBanner() {
  const mediaIndex = useMediaIndex()
  const showWarningIcon = mediaIndex >= 2

  return (
    <Card padding={4} tone="caution" width="fill">
      <Flex gap={3} align="center" justify="center">
        <Text hidden={!showWarningIcon}>
          <WarningOutlineIcon />
        </Text>

        <Text size={1} weight="medium">
          You are running both the new Releases and Scheduled Publishing
        </Text>
        <Text size={1} style={{whiteSpace: 'nowrap'}}>
          <a href={RELEASES_DOCS_URL} target="_blank" rel="noreferrer">
            Read more {` `}
            <SmallIcon />
          </a>
        </Text>
      </Flex>
    </Card>
  )
}
