import {Box, Flex, Stack, Text} from '@sanity/ui'
import {getTheme_v2} from '@sanity/ui/theme'
import {type ElementType, type ReactNode} from 'react'
import {css, styled} from 'styled-components'

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

const TITLE_SIZE = 4

// Lift the title by its top half-leading so its cap-height sits on the block's top edge. The
// properties panel beside it hangs its top border from that same edge, so this makes the title's
// visible top and the panel border read as one clean starting line — instead of the border appearing
// to cut across the title (a text line-box is taller than its glyphs, so an untrimmed title's cap
// starts a few px below the layout edge the panel border aligns to). Derived from the theme's font
// metrics so it stays correct if the type scale changes.
const Identity = styled(Stack)((props) => {
  const {font} = getTheme_v2(props.theme)
  const {fontSize, lineHeight} = font.text.sizes[TITLE_SIZE]
  const topLeading = Math.round((lineHeight - fontSize) / 2)
  return css`
    margin-top: -${topLeading}px;

    [data-ui='detail-identity-action'] {
      opacity: 0;
      transition: opacity 150ms;
    }

    &:hover [data-ui='detail-identity-action'],
    &:focus-within [data-ui='detail-identity-action'] {
      opacity: 1;
    }
  `
})

/**
 * The identity block (title + description) of an entity detail page, as a read-only **display**
 * surface. Title renders bold; description clamps to four lines with the full text on hover. An
 * optional `titleAction` (revealed on hover/focus) can sit beside the title. Shared by the Releases
 * and Variant-definition detail pages so both read as one family.
 *
 * @internal
 */
export function DetailIdentity(props: {
  title: string | undefined
  titlePlaceholder: string
  description?: string
  titleAction?: ReactNode
  /** Element the title renders as — pass `"h1"` to make it the page heading. Defaults to a span. */
  titleAs?: ElementType
  titleTestId?: string
  descriptionTestId?: string
}): React.JSX.Element {
  const {
    title,
    titlePlaceholder,
    description,
    titleAction,
    titleAs,
    titleTestId,
    descriptionTestId,
  } = props

  return (
    <Identity space={3}>
      <Flex align="center" gap={2}>
        <Text
          as={titleAs}
          size={4}
          weight="bold"
          style={title ? undefined : {opacity: 0.5}}
          data-testid={titleTestId}
        >
          {title || titlePlaceholder}
        </Text>
        {titleAction && (
          <Box flex="none" data-ui="detail-identity-action">
            {titleAction}
          </Box>
        )}
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
    </Identity>
  )
}
