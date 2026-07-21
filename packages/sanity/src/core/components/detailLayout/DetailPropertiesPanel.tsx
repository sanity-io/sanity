import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type CSSProperties, type ReactNode} from 'react'

// Each row is the same fixed height so the key/value pairs sit on an even rhythm — otherwise a row
// holding a taller control (e.g. a picker button) would space itself further from its neighbours
// than the plain rows are from each other.
const ROW_STYLE: CSSProperties = {minHeight: 31}

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
  const {sections, testId, width = 260} = props

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
                  align="center"
                  gap={3}
                  justify="space-between"
                  style={ROW_STYLE}
                >
                  <Text muted size={1}>
                    {row.label}
                  </Text>
                  {typeof row.value === 'string' ? <Text size={1}>{row.value}</Text> : row.value}
                </Flex>
              ))}
            </Stack>
          )
        })}
      </Stack>
    </Card>
  )
}
