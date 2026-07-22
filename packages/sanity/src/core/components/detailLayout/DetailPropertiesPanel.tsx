import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {type CSSProperties, type ReactNode} from 'react'

// Each row is the same fixed height so the key/value pairs sit on an even rhythm — otherwise a row
// holding a taller control (e.g. a picker button) would space itself further from its neighbours
// than the plain rows are from each other.
const ROW_STYLE: CSSProperties = {minHeight: 31}

// The label sits in a fixed-width column with the value flush beside it (a definition list), rather
// than pushed to opposite edges: a one-character value (an icon, a count) would otherwise strand a
// cavernous gap between it and its label. Fixed width also aligns the values into a clean column.
const LABEL_STYLE: CSSProperties = {width: 92, flexShrink: 0}

// The value column takes the remaining width and owns its own wrapping: min-width:0 lets it shrink
// inside the flex row so a wide value (e.g. a full scheduled date-time) wraps onto a second line
// within this column instead of overflowing the card or breaking the two-column grid.
const VALUE_STYLE: CSSProperties = {minWidth: 0}

/** A single `label · value` row. `null`/`false` rows are skipped, so callers can inline conditions. */
export interface DetailPropertyRow {
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
 * labeled sections, each a set of `label · value` rows on an even, fixed-height rhythm. Shared by
 * the Releases and Variant-definition detail pages so both read as one family.
 *
 * @internal
 */
export function DetailPropertiesPanel(props: {
  sections: DetailPropertiesSection[]
  testId?: string
  width?: number
}): React.JSX.Element {
  const {sections, testId, width = 320} = props

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
                  align="flex-start"
                  gap={3}
                  style={ROW_STYLE}
                >
                  <Box style={LABEL_STYLE} paddingY={1}>
                    <Text muted size={1} textOverflow="ellipsis">
                      {row.label}
                    </Text>
                  </Box>
                  {/* The value keeps its own (right) column and wraps *within* it — a wide value
                      like a full scheduled date-time grows onto a second line inside the column,
                      rather than overflowing the panel or spanning full width and breaking the
                      two-column key/value grid. */}
                  <Box flex={1} paddingY={1} style={VALUE_STYLE}>
                    {typeof row.value === 'string' ? <Text size={1}>{row.value}</Text> : row.value}
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
