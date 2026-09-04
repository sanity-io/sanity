import {Card, Flex, Stack, Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {Fragment, type ReactNode} from 'react'
import {Box} from 'ui5'

import {
  glyphCell,
  propertiesCard,
  propertiesCardMarginTopVar,
  propertiesCardMaxWidthVar,
  sectionGrid,
} from './DetailPropertiesPanel.css'

// At or above this many rows, a `multiColumn` section splits into two side-by-side columns so a
// long list (e.g. six targeting conditions) reads as a compact block instead of a tall stack.
// Below it, a short list stays single-column — two columns of one or two rows just looks sparse.
const MULTI_COLUMN_THRESHOLD = 5

// The size of the detail-page title (bold, size 4) this panel sits beside. Used to drop the panel by
// the title's top half-leading (see `propertiesCard` in the .css.ts). Derived from theme font
// metrics so it tracks the type scale.
const TITLE_SIZE = 4

/**
 * A single row: an optional leading `icon` (a glyph accompanying the label), a `label`, and a
 * `value`. `null`/`false` rows are skipped, so callers can inline conditions.
 */
interface DetailPropertyRow {
  icon?: ReactNode
  label: string
  value: ReactNode
}

/** A group of rows, optionally headed by a section title. */
export interface DetailPropertiesSection {
  title?: string
  rows: (DetailPropertyRow | null | false | undefined)[]
  /**
   * When set, a section with several rows splits into two side-by-side columns (each a self-aligned
   * `[glyph] [label] [value]` grid), collapsing back to one column when the panel is too narrow to
   * hold both. Off by default, so single-column sections (e.g. Releases) are unaffected.
   */
  multiColumn?: boolean
}

// One aligned [glyph] [label] [value] grid for a set of rows. Factored out so a multi-column
// section can render two of them side by side while each keeps its own internal alignment.
function PropertyRowsGrid({
  rows,
  hasGlyphs,
}: {
  rows: DetailPropertyRow[]
  hasGlyphs: boolean
}): React.JSX.Element {
  return (
    <div className={hasGlyphs ? sectionGrid.withGlyphs : sectionGrid.withoutGlyphs}>
      {rows.map((row, rowIndex) => (
        // oxlint-disable-next-line no-array-index-key
        <Fragment key={rowIndex}>
          {hasGlyphs && <div className={glyphCell}>{row.icon}</div>}
          <Text muted size={1}>
            {row.label}
          </Text>
          {/* Pure-text value on one left edge; a long value truncates (title tooltip shows the full
              text) rather than wrapping and breaking the single-line grid. */}
          <Box style={{minWidth: 0}}>
            {typeof row.value === 'string' ? (
              <Text size={1} textOverflow="ellipsis" title={row.value}>
                {row.value}
              </Text>
            ) : (
              row.value
            )}
          </Box>
        </Fragment>
      ))}
    </div>
  )
}

/**
 * The bordered "properties" surface beside the identity block on an entity detail page. Renders N
 * labeled sections as an aligned `[glyph] [label] [value]` grid: a leading-glyph column, a
 * content-sized label column, and a value column of pure single-line text (semantic colour carries
 * meaning; no chips). The panel sizes to its content up to `maxWidth`; values that overflow truncate
 * with a tooltip rather than wrap. Shared by the Releases and Variant-definition detail pages so both
 * read as one family.
 *
 * @internal
 */
export function DetailPropertiesPanel(props: {
  sections: DetailPropertiesSection[]
  testId?: string
  /** Upper bound on the panel width; it shrinks to fit its content below this. */
  maxWidth?: number
}): React.JSX.Element {
  const {sections, testId, maxWidth = 300} = props
  const {font} = useThemeV2()
  const {fontSize, lineHeight} = font.text.sizes[TITLE_SIZE]
  const titleTopLeading = Math.round((lineHeight - fontSize) / 2)

  return (
    <Card
      className={propertiesCard}
      style={assignInlineVars({
        [propertiesCardMaxWidthVar]: `${maxWidth}px`,
        [propertiesCardMarginTopVar]: `${titleTopLeading}px`,
      })}
      flex="none"
      border
      radius={3}
      padding={3}
      tone="transparent"
      data-testid={testId}
    >
      <Stack gap={4}>
        {sections.map((section, sectionIndex) => {
          const rows = section.rows.filter((row): row is DetailPropertyRow => Boolean(row))
          if (rows.length === 0) return null
          // Only reserve the glyph column when a row in this section actually carries a glyph.
          const hasGlyphs = rows.some((row) => Boolean(row.icon))
          // A multi-column section splits its rows into two balanced columns that wrap back to one
          // when the panel is squeezed (flex-wrap, so no container-query fragility). The first
          // (left) column takes the ceiling half, so an odd count leans left.
          const splitIntoColumns = section.multiColumn && rows.length >= MULTI_COLUMN_THRESHOLD
          const leftCount = Math.ceil(rows.length / 2)

          return (
            // Sections are positional and static, so the index is a stable key.
            // oxlint-disable-next-line no-array-index-key
            <Stack key={sectionIndex} gap={2}>
              {section.title && (
                <Text muted size={0} weight="semibold" style={{textTransform: 'uppercase'}}>
                  {section.title}
                </Text>
              )}
              {splitIntoColumns ? (
                <Flex gap={4} wrap="wrap">
                  <PropertyRowsGrid hasGlyphs={hasGlyphs} rows={rows.slice(0, leftCount)} />
                  <PropertyRowsGrid hasGlyphs={hasGlyphs} rows={rows.slice(leftCount)} />
                </Flex>
              ) : (
                <PropertyRowsGrid hasGlyphs={hasGlyphs} rows={rows} />
              )}
            </Stack>
          )
        })}
      </Stack>
    </Card>
  )
}
