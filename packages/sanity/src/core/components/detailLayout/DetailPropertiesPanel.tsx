import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {Fragment, type ReactNode} from 'react'
import {css, styled} from 'styled-components'

// At or above this many rows, a `multiColumn` section splits into two side-by-side columns so a
// long list (e.g. six targeting conditions) reads as a compact block instead of a tall stack.
// Below it, a short list stays single-column — two columns of one or two rows just looks sparse.
const MULTI_COLUMN_THRESHOLD = 5

// The panel sizes to its content (so a short two-row panel doesn't leave a wide empty gap) but never
// grows past a sensible max, at which point long values truncate instead of stretching the pane.
const PropertiesCard = styled(Card)<{$maxWidth: number}>`
  width: fit-content;
  max-width: ${(props) => props.$maxWidth}px;
`

// One grid per section so every row shares column tracks and stays aligned:
//  - glyph  (auto) — only present when the section has glyphs
//  - label  (max-content) — sizes to the widest label, so labels never truncate and values start on
//                           one clean left edge
//  - value  (minmax(0, 1fr)) — takes the rest; min-width:0 lets a long value truncate in its column
// grid-auto-rows keeps every row on an even minimum height, matching the old rhythm.
const SectionGrid = styled.div<{$hasGlyphs: boolean}>`
  display: grid;
  align-items: center;
  column-gap: 12px;
  row-gap: 6px;
  grid-auto-rows: minmax(25px, auto);
  ${(props) =>
    props.$hasGlyphs
      ? css`
          grid-template-columns: auto max-content minmax(0, 1fr);
        `
      : css`
          grid-template-columns: max-content minmax(0, 1fr);
        `}
`

const GlyphCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
`

/**
 * A single row: an optional leading `icon` (a glyph accompanying the label), a `label`, and a
 * `value`. `null`/`false` rows are skipped, so callers can inline conditions.
 */
export interface DetailPropertyRow {
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
    <SectionGrid $hasGlyphs={hasGlyphs}>
      {rows.map((row, rowIndex) => (
        // oxlint-disable-next-line no-array-index-key
        <Fragment key={rowIndex}>
          {hasGlyphs && <GlyphCell>{row.icon}</GlyphCell>}
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
    </SectionGrid>
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

  return (
    <PropertiesCard
      flex="none"
      border
      radius={3}
      padding={3}
      tone="transparent"
      $maxWidth={maxWidth}
      data-testid={testId}
    >
      <Stack space={4}>
        {sections.map((section, sectionIndex) => {
          const rows = section.rows.filter((row): row is DetailPropertyRow => Boolean(row))
          if (rows.length === 0) return null
          // Only reserve the glyph column when a row in this section actually carries a glyph.
          const hasGlyphs = rows.some((row) => Boolean(row.icon))
          // A multi-column section with enough rows splits into two balanced columns that wrap back
          // to one when the panel is squeezed (flex-wrap, so no container-query fragility). The
          // first (left) column takes the ceiling half, so an odd count leans left.
          const splitIntoColumns = section.multiColumn && rows.length >= MULTI_COLUMN_THRESHOLD
          const leftCount = Math.ceil(rows.length / 2)

          return (
            // Sections are positional and static, so the index is a stable key.
            // oxlint-disable-next-line no-array-index-key
            <Stack key={sectionIndex} space={2}>
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
    </PropertiesCard>
  )
}
