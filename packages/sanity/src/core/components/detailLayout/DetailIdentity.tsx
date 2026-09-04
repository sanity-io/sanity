import {Flex, Stack, Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps, type ElementType} from 'react'
import {Box} from 'ui5'

import {Tooltip} from '../../../ui-components/tooltip/Tooltip'
import {
  clampedDescription,
  descriptionFontFamilyVar,
  descriptionFontSizeVar,
  descriptionLineHeightVar,
} from './DetailIdentity.css'

const DESCRIPTION_TOOLTIP_MAX_WIDTH = 360

// Bounded, four-line description: title + up to four lines makes the identity block sit at (and
// never exceed) the height of the properties panel beside it, so the top band is one even zone.
// Full text lives in the hover tooltip; maxWidth keeps the line length fixed rather than stretching
// across the whole pane.
//
// This is a plain div rather than @sanity/ui <Text> on purpose: <Text> forces its own
// `display` (flow-root), which defeats `-webkit-line-clamp` (that needs display:-webkit-box) and
// collapses the box, clipping the first line. Owning the element lets the clamp work correctly.
function ClampedDescription(props: ComponentProps<'div'>) {
  const {className, style, ...rest} = props
  const {font} = useThemeV2()

  return (
    <div
      {...rest}
      className={clsx(clampedDescription, className)}
      style={{
        ...assignInlineVars({
          [descriptionFontFamilyVar]: font.text.family,
          [descriptionFontSizeVar]: `${font.text.sizes[2].fontSize}px`,
          [descriptionLineHeightVar]: `${font.text.sizes[2].lineHeight}px`,
        }),
        ...style,
      }}
    />
  )
}

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
