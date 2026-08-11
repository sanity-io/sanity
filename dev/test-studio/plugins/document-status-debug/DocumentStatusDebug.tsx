import {DocumentIcon} from '@sanity/icons/Document'
import {Box, Card, Flex, Heading, Stack, Switch, Text} from '@sanity/ui'
import {type ChangeEvent, useCallback, useState} from 'react'
import {DocumentStatusIndicator, PreviewCard, SanityDefaultPreview} from 'sanity'
import {PerspectiveContext} from 'sanity/_singletons'

import {type DebugRow, type DebugScenario, scenarios} from './fixtures'

const BUTTON_CARD_STYLE = {width: '100%', textAlign: 'left'} as const
// Roughly a document list pane, so the status icons sit as close to the title as they do in the
// studio rather than a screen width away.
const ROWS_CARD_STYLE = {maxWidth: 350} as const

/**
 * Renders every state `DocumentStatusIndicator` can produce, using fabricated documents. Only the
 * version metadata the indicator actually reads is real, so nothing here needs to exist in the
 * dataset.
 */
export function DocumentStatusDebug() {
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [selectAll, setSelectAll] = useState(false)

  const handleToggle = useCallback((key: string) => {
    setSelected((current) => ({...current, [key]: !current[key]}))
  }, [])

  const handleSelectAllChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSelectAll(event.currentTarget.checked)
  }, [])

  return (
    <Flex direction="column" height="fill">
      <Card borderBottom padding={4}>
        <Flex align="flex-start" gap={4}>
          <Stack flex={1} gap={3}>
            <Heading size={1}>Document status indicator</Heading>
            <Text muted size={1}>
              Every state the indicator can render, grouped by what is selected in the perspective
              bar. Hover a row to see the hover state, click it to toggle selected.
            </Text>
          </Stack>
          <Flex align="center" gap={3} paddingTop={1}>
            <Text size={1} weight="medium">
              Select all
            </Text>
            <Switch checked={selectAll} onChange={handleSelectAllChange} />
          </Flex>
        </Flex>
      </Card>
      <Box flex={1} overflow="auto" padding={4}>
        <Stack gap={6}>
          {scenarios.map((scenario) => (
            <Scenario
              key={scenario.id}
              onToggle={handleToggle}
              scenario={scenario}
              selectAll={selectAll}
              selected={selected}
            />
          ))}
        </Stack>
      </Box>
    </Flex>
  )
}

function Scenario({
  onToggle,
  scenario,
  selectAll,
  selected,
}: {
  onToggle: (key: string) => void
  scenario: DebugScenario
  selectAll: boolean
  selected: Record<string, boolean>
}) {
  return (
    <Stack gap={3}>
      <Stack gap={2} paddingX={1}>
        <Heading size={0}>{scenario.title}</Heading>
        <Text muted size={1}>
          {scenario.description}
        </Text>
      </Stack>
      <PerspectiveContext.Provider value={scenario.perspective}>
        <Card border padding={1} radius={3} style={ROWS_CARD_STYLE}>
          <Stack gap={1}>
            {scenario.rows.map((row, index) => {
              const key = `${scenario.id}:${index}`

              return (
                <Row
                  key={key}
                  onToggle={onToggle}
                  row={row}
                  rowKey={key}
                  selected={selectAll || Boolean(selected[key])}
                />
              )
            })}
          </Stack>
        </Card>
      </PerspectiveContext.Provider>
    </Stack>
  )
}

function Row({
  onToggle,
  row,
  rowKey,
  selected,
}: {
  onToggle: (key: string) => void
  row: DebugRow
  rowKey: string
  selected: boolean
}) {
  const handleClick = useCallback(() => onToggle(rowKey), [onToggle, rowKey])

  return (
    <PreviewCard
      __unstable_focusRing
      as="button"
      data-as="button"
      onClick={handleClick}
      radius={2}
      selected={selected}
      style={BUTTON_CARD_STYLE}
      tone="inherit"
      type="button"
    >
      <SanityDefaultPreview
        icon={DocumentIcon}
        layout="default"
        status={<DocumentStatusIndicator documentVersions={row.versions} />}
        subtitle={row.expected}
        title={row.title}
        // The rows are pane-width, so both lines truncate. The tooltip is the only place the full
        // description is readable.
        tooltip={`${row.title} — ${row.expected}`}
      />
    </PreviewCard>
  )
}
