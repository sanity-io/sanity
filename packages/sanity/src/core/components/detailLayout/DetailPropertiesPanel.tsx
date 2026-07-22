import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {type CSSProperties, type ReactNode} from 'react'

// Every row is the same fixed height so the rows sit on an even rhythm.
const ROW_STYLE: CSSProperties = {minHeight: 29}

// A reserved leading slot for an optional glyph that accompanies the label (not the value), so the
// value column stays pure text on one left edge. Fixed width means labels align whether or not a
// given row carries a glyph.
const GLYPH_STYLE: CSSProperties = {width: 20, flexShrink: 0}

// The label sits in a fixed-width column so every value starts on the same left edge (a clean
// definition-list grid), rather than being pushed around by varying label widths.
const LABEL_STYLE: CSSProperties = {width: 84, flexShrink: 0}

// The value column takes the remaining width; min-width:0 lets a long value truncate (with a title
// tooltip) inside its column rather than overflow the card or wrap and break the single-line grid.
const VALUE_STYLE: CSSProperties = {minWidth: 0}

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
 * labeled sections as an aligned `[glyph] [label] [value]` grid: one leading-glyph column, one
 * label column, and a value column of pure single-line text (semantic colour carries meaning; no
 * chips). Values that overflow truncate with a tooltip rather than wrap. Shared by the Releases and
 * Variant-definition detail pages so both read as one family.
 *
 * @internal
 */
export function DetailPropertiesPanel(props: {
  sections: DetailPropertiesSection[]
  testId?: string
  width?: number
}): React.JSX.Element {
  const {sections, testId, width = 300} = props

  return (
    <Card
      flex="none"
      border
      radius={3}
      padding={3}
      tone="transparent"
      style={{width}}
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
              {rows.map((row, rowIndex) => (
                <Flex
                  // oxlint-disable-next-line no-array-index-key
                  key={rowIndex}
                  align="center"
                  gap={3}
                  style={ROW_STYLE}
                >
                  {hasGlyphs && (
                    <Flex style={GLYPH_STYLE} align="center" justify="center">
                      {row.icon}
                    </Flex>
                  )}
                  <Box style={LABEL_STYLE}>
                    <Text muted size={1} textOverflow="ellipsis">
                      {row.label}
                    </Text>
                  </Box>
                  {/* Pure-text value column on one left edge; long values truncate (title tooltip
                      shows the full text) rather than wrap, keeping the single-line grid. */}
                  <Box flex={1} style={VALUE_STYLE}>
                    {typeof row.value === 'string' ? (
                      <Text size={1} textOverflow="ellipsis" title={row.value}>
                        {row.value}
                      </Text>
                    ) : (
                      row.value
                    )}
                  </Box>
                </Flex>
              ))}
            </Stack>
          )
        })}
      </Stack>
    </Card>
  )
}
