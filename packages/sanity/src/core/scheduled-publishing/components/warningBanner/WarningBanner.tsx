import {ArrowRightIcon, WarningOutlineIcon} from '@sanity/icons'
import {Card, Flex, Text, useMediaIndex} from '@sanity/ui'
import {vars} from '@sanity/ui/css'
import {css, styled} from 'styled-components'

import {RELEASES_DOCS_URL} from '../../constants'

/**
 * Updates the size of the icon to be used inside a Text size=1 to a Text size=0, without having to add a new
 * Text element, allowing to sit inline in the same anchor element.
 */
const SmallIcon = styled(ArrowRightIcon)(() => {
  const {ascenderHeight, descenderHeight, lineHeight, iconSize} = vars.font.text.scale[0]
  const negHeight = `calc(${ascenderHeight} + ${descenderHeight})`
  const capHeight = `calc(${lineHeight} - ${negHeight})`
  const iconOffset = `calc((${capHeight} - ${iconSize}) / 2)`

  return css`
    &[data-sanity-icon] {
      color: ${vars.color.link.fg};
      font-size: calc(${iconSize} / 16 * 1rem);
      margin: ${iconOffset};
      margin-bottom: ${iconOffset};
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
