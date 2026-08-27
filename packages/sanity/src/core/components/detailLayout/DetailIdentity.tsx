import {Flex, Stack, Text} from '@sanity/ui'
import {getTheme_v2} from '@sanity/ui/theme'
import {type ElementType} from 'react'
import {css, styled} from 'styled-components'
import {Box} from 'ui5'

import {Tooltip} from '../../../ui-components/tooltip/Tooltip'

const DESCRIPTION_TOOLTIP_MAX_WIDTH = 360

// Bounded, four-line description: title + up to four lines makes the identity block sit at (and
// never exceed) the height of the properties panel beside it, so the top band is one even zone.
// Full text lives in the hover tooltip; maxWidth keeps the line length fixed rather than stretching
// across the whole pane.
//
// This is a plain styled.div rather than @sanity/ui <Text> on purpose: <Text> forces its own
// `display` (flow-root), which defeats `-webkit-line-clamp` (that needs display:-webkit-box) and
// collapses the box, clipping the first line. Owning the element lets the clamp work correctly.
const ClampedDescription = styled.div((props) => {
  const {font} = getTheme_v2(props.theme)
  return css`
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 4;
    overflow: hidden;
    max-width: 560px;
    margin: 0;
    font-family: ${font.text.family};
    font-size: ${font.text.sizes[2].fontSize}px;
    line-height: ${font.text.sizes[2].lineHeight}px;
    color: var(--card-muted-fg-color);
  `
})

/**
 * The identity block (title + description) of an entity detail page, as a read-only **display**
 * surface. Title renders bold; description clamps to four lines with the full text on hover.
 * Shared by the Releases and Variant-definition detail pages so both read as one family.
 *
 * @internal
 */
export function DetailIdentity(props: {
  title: string | undefined
  titlePlaceholder: string
  description?: string
  /** Element the title renders as — pass `"h1"` to make it the page heading. Defaults to a span. */
  titleAs?: ElementType
  titleTestId?: string
  descriptionTestId?: string
}): React.JSX.Element {
  const {title, titlePlaceholder, description, titleAs, titleTestId, descriptionTestId} = props

  return (
    <Stack gap={3}>
      <Flex align="center" gap={2}>
        {/* Box flex={1} lets the title shrink and truncate instead of overflowing its
            zone; the full title is available on hover. */}
        <Box flexBasis="0%" flexGrow={1}>
          <Text
            as={titleAs}
            size={4}
            weight="bold"
            textOverflow="ellipsis"
            title={title || undefined}
            style={title ? undefined : {opacity: 0.5}}
            data-testid={titleTestId}
          >
            {title || titlePlaceholder}
          </Text>
        </Box>
      </Flex>

      {description && (
        <Tooltip
          placement="bottom-start"
          content={
            <Box padding={2} style={{maxWidth: DESCRIPTION_TOOLTIP_MAX_WIDTH}}>
              <Text muted size={1} style={{whiteSpace: 'pre-wrap'}}>
                {description}
              </Text>
            </Box>
          }
        >
          <ClampedDescription data-testid={descriptionTestId}>{description}</ClampedDescription>
        </Tooltip>
      )}
    </Stack>
  )
}
