import {Box, Card, Stack, Text} from '@sanity/ui'
import {Fragment, type ReactNode} from 'react'
import {css, styled} from 'styled-components'

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
          return (
            // Sections are positional and static, so the index is a stable key.
            // oxlint-disable-next-line no-array-index-key
            <Stack key={sectionIndex} space={2}>
              {section.title && (
                <Text muted size={0} weight="semibold" style={{textTransform: 'uppercase'}}>
                  {section.title}
                </Text>
              )}
              <SectionGrid $hasGlyphs={hasGlyphs}>
                {rows.map((row, rowIndex) => (
                  // oxlint-disable-next-line no-array-index-key
                  <Fragment key={rowIndex}>
                    {hasGlyphs && <GlyphCell>{row.icon}</GlyphCell>}
                    <Text muted size={1}>
                      {row.label}
                    </Text>
                    {/* Pure-text value on one left edge; a long value truncates (title tooltip shows
                        the full text) rather than wrapping and breaking the single-line grid. */}
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
            </Stack>
          )
        })}
      </Stack>
    </PropertiesCard>
  )
}
