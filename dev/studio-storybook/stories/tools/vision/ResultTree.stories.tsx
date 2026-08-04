import {Badge, Box, Card, Code, Flex, Inline, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

// Real components from real source (org contract §8): the Vision result pane
// (`VisionGuiResult` — tree + timings footer + downloads) and the JSON tree itself
// (`ResultView`, backed by @rexxars/react-json-inspector). Prop-driven; every audit
// negative on this page lives in exactly these components.
import {ResultView} from '../../../../../packages/@sanity/vision/src/components/ResultView'
import {VisionGuiResult} from '../../../../../packages/@sanity/vision/src/components/VisionGuiResult'
import {
  createMockVisionClient,
  type VisionBookResult,
  visionBookResults,
} from '../../../lib/mockVisionClient'
import {WithStudioProviders} from '../../../lib/testProvider'
import {
  AuditNote,
  ResultFrame,
  VISION_DATASET,
  visionSchemaTypes,
} from '../../../lib/visionStoryKit'

/** A larger result set (the 6 fixture books, repeated) for the scrolling / large story. */
const largeResult: VisionBookResult[] = Array.from({length: 4}, (_, i) =>
  visionBookResults.map((b) => ({...b, _id: `${b._id}-${i}`})),
).flat()

const meta: Meta = {
  title: 'Lists & Data/Vision/ResultTree',
  parameters: {
    layout: 'fullscreen',
    controls: {include: []},
    docs: {
      description: {
        component: [
          'The result tree carries three findings at once: hovering a node surfaces no ' +
            'orientation, every result renders only as a tree, and the timing footer never says ' +
            'how many documents came back or whether the API truncated them.',
          '',
          '|          |                                                                                                                            |',
          '| -------- | -------------------------------------------------------------------------------------------------------------------------- |',
          '| Source   | `packages/@sanity/vision/src/components/VisionGuiResult` (the whole right pane) and `ResultView` (the JSON tree inside it) |',
          '| Tier     | SERVICE. The result of a query, plus the Execution / End-to-end timings footer and the JSON / CSV download buttons         |',
          '| Audit    | 🔴 needs-work, three findings below                                                                                        |',
          '| Patterns | `datatips` · `query-result-shaping` · `sampling-disclosure`                                                                |',
          '',
          'The tree is live: click any composite node (`▸`) to expand or collapse it; nested ' +
            'objects and arrays open to depth 4 by default. On a value whose dataset matches the ' +
            'workspace, `_id` / `_ref` grow an edit-intent link. The tree renders at code size 2, ' +
            '15px.',
          '',
          '<details>',
          '<summary><b>Hovering a node surfaces nothing: no type, path, or value ' +
            'tip.</b></summary>',
          '',
          '`datatips`. A deep or wide tree gives no orientation on hover, so the author has to ' +
            'expand and read structurally to answer "what is this field?".',
          '',
          '</details>',
          '',
          '<details>',
          '<summary><b>Every result is a JSON tree and only a tree.</b></summary>',
          '',
          '`query-result-shaping`. A flat list of records, the commonest GROQ shape, has no ' +
            'table projection, only nested nodes to expand and compare.',
          '',
          '</details>',
          '',
          '<details>',
          '<summary><b>The footer reports timing and nothing else.</b></summary>',
          '',
          '`sampling-disclosure`. It never states the returned count, the dataset total, or ' +
            'whether the API truncated the result. A truncated result looks identical to a ' +
            'complete one.',
          '',
          '</details>',
          '',
          '> **Why it matters:** a truncated result looks identical to a complete one, so it is ' +
            'easy to reason about a partial answer as though it were the whole set. The footer ' +
            'says how long the query took and nothing about what it actually returned.',
        ].join('\n'),
      },
    },
  },
  decorators: [
    WithStudioProviders({
      config: {schema: {name: 'storybook', types: visionSchemaTypes}},
      client: createMockVisionClient(),
    }),
  ],
  tags: [
    'autodocs',
    'chapter:data',
    'pattern:datatips',
    'pattern:query-result-shaping',
    'pattern:sampling-disclosure',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/** The pane before any query has run: the real empty state, footer timings read "n/a". */
export const Empty: Story = {
  name: 'Empty (nothing run)',
  render: () => (
    <Card padding={4}>
      <ResultFrame height={320}>
        <VisionGuiResult
          queryInProgress={false}
          listenInProgress={false}
          listenMutations={[]}
          dataset={VISION_DATASET}
          queryResult={undefined}
          error={undefined}
          queryTime={undefined}
          e2eTime={undefined}
        />
      </ResultFrame>
    </Card>
  ),
}

/**
 * A small result (6 books, authors dereferenced inline) in the real pane, with real
 * timings and the download buttons. The tree is live: expand and collapse the `author`
 * objects.
 */
export const SmallResult: Story = {
  name: 'Small result (live expand / collapse)',
  render: () => (
    <Card padding={4}>
      <ResultFrame>
        <VisionGuiResult
          queryInProgress={false}
          listenInProgress={false}
          listenMutations={[]}
          dataset={VISION_DATASET}
          queryResult={visionBookResults}
          error={undefined}
          queryTime={14}
          e2eTime={212}
        />
      </ResultFrame>
    </Card>
  ),
}

/** A larger result (24 records) so the tree scrolls: the everyday "list of docs" shape. */
export const LargeResult: Story = {
  name: 'Large result (scrolling tree)',
  render: () => (
    <Card padding={4}>
      <ResultFrame height={520}>
        <VisionGuiResult
          queryInProgress={false}
          listenInProgress={false}
          listenMutations={[]}
          dataset={VISION_DATASET}
          queryResult={largeResult}
          error={undefined}
          queryTime={31}
          e2eTime={288}
        />
      </ResultFrame>
    </Card>
  ),
}

/**
 * **Audit finding: `datatips`.** The same live tree. Hover any key or value: nothing
 * appears. There is no type, no keypath, no full-value-on-truncation tip. On a wide or deep
 * result the author has to expand and read structurally to answer "what is this field?".
 */
export const Datatips: Story = {
  name: 'Current (no hover datatip)',
  tags: ['audit:needs-work'],
  render: () => (
    <Card padding={4}>
      <Stack gap={3}>
        <ResultFrame>
          <VisionGuiResult
            queryInProgress={false}
            listenInProgress={false}
            listenMutations={[]}
            dataset={VISION_DATASET}
            queryResult={visionBookResults}
            error={undefined}
            queryTime={14}
            e2eTime={212}
          />
        </ResultFrame>
        <AuditNote>
          Hover a node: no tip. The tree carries the keypath and value type internally (it needs
          them to render), so a datatip is derivable without touching the query.
        </AuditNote>
      </Stack>
    </Card>
  ),
}

/**
 * **Audit finding: `sampling-disclosure`.** The shipped footer. It reports Execution and
 * End-to-end time and nothing else. Six documents came back; the footer never says so, never
 * states the dataset total, and a truncated result would look identical to a complete one.
 */
export const SamplingCurrent: Story = {
  name: 'Current (footer hides count & truncation)',
  tags: ['audit:needs-work'],
  render: () => (
    <Card padding={4}>
      <ResultFrame>
        <VisionGuiResult
          queryInProgress={false}
          listenInProgress={false}
          listenMutations={[]}
          dataset={VISION_DATASET}
          queryResult={visionBookResults}
          error={undefined}
          queryTime={14}
          e2eTime={212}
        />
      </ResultFrame>
    </Card>
  ),
}

/** A footer strip mirroring the shipped timings row, with the missing disclosure added. */
function DisclosureFooter(props: {returned: number; total: number; truncated: boolean}) {
  const {returned, total, truncated} = props
  return (
    <Card borderTop paddingX={4} paddingY={3} tone={truncated ? 'caution' : 'default'}>
      <Flex align="center" justify="space-between" gap={3}>
        <Inline gap={4}>
          <Text muted size={2}>
            Execution: 14ms
          </Text>
          <Text muted size={2}>
            End-to-end: 212ms
          </Text>
        </Inline>
        <Inline gap={2}>
          {truncated ? (
            <Badge tone="caution" fontSize={1} padding={2}>
              Showing {returned.toLocaleString()} of {total.toLocaleString()}, truncated
            </Badge>
          ) : (
            <Badge tone="positive" fontSize={1} padding={2}>
              {returned.toLocaleString()} documents, complete result
            </Badge>
          )}
        </Inline>
      </Flex>
    </Card>
  )
}

/**
 * **Recommended.** The same result tree, but the footer discloses sampling: how many
 * documents were returned, and, when capped, how many the query actually matched, flagged
 * as truncated. Two rows: a complete result and a truncated one. The tree is the real
 * `ResultView`; only the footer is the proposed fix.
 */
export const SamplingRecommended: Story = {
  name: 'Recommended (footer discloses count & truncation)',
  tags: ['variant:recommended'],
  render: () => (
    <Card padding={4}>
      <Stack gap={3}>
        <Card border radius={2} overflow="hidden">
          <Box padding={3} style={{maxHeight: 260, overflow: 'auto'}}>
            <ResultView data={visionBookResults} datasetName={VISION_DATASET} />
          </Box>
          <DisclosureFooter returned={visionBookResults.length} total={6} truncated={false} />
        </Card>
        <Card border radius={2} overflow="hidden">
          <Box padding={3} style={{maxHeight: 120, overflow: 'auto'}}>
            <ResultView data={visionBookResults.slice(0, 2)} datasetName={VISION_DATASET} />
          </Box>
          <DisclosureFooter returned={1000} total={4213} truncated />
        </Card>
        <AuditNote tone="positive">
          The count and truncation state are metadata the fetch already has (result length; the
          API's capped-result signal), surfacing them is a footer change, no new query.
        </AuditNote>
      </Stack>
    </Card>
  ),
}

/**
 * **Audit finding: `query-result-shaping`.** The shipped result view renders every result
 * as a JSON tree and only a JSON tree. For a flat list of records, the commonest GROQ shape,
 * that means scrolling nested nodes to compare rows, with no way to pivot into a table.
 */
export const ShapingCurrent: Story = {
  name: 'Current (JSON tree only)',
  tags: ['audit:needs-work'],
  render: () => (
    <Card padding={4}>
      <Card border radius={2} overflow="hidden">
        <Box padding={3} style={{maxHeight: 420, overflow: 'auto'}}>
          <ResultView data={visionBookResults} datasetName={VISION_DATASET} />
        </Box>
      </Card>
    </Card>
  ),
}

/**
 * A table projection of the same array, styled from the same theme tokens the result tree
 * uses: the card border color, the code hover background, the mono code font for values.
 * One row per record; columns derived from the keys; numerics right-aligned.
 */
function ResultTable(props: {rows: VisionBookResult[]}) {
  const columns: {
    key: string
    label: string
    align?: 'right'
    get: (r: VisionBookResult) => string
  }[] = [
    {key: 'title', label: 'title', get: (r) => r.title},
    {key: 'year', label: 'year', align: 'right', get: (r) => String(r.year)},
    {key: 'authorName', label: 'author.name', get: (r) => r.author.name},
    {key: 'authorEra', label: 'author.era', get: (r) => r.author.era},
  ]
  return (
    <Card border radius={2} overflow="hidden">
      <style>{`
        .vision-result-table { border-collapse: collapse; width: 100%; }
        .vision-result-table th, .vision-result-table td {
          padding: 8px 14px;
          border-bottom: 1px solid var(--card-border-color);
          text-align: left;
          white-space: nowrap;
        }
        .vision-result-table thead th {
          position: sticky; top: 0;
          background: var(--card-code-bg-color);
          border-bottom: 1px solid var(--card-border-color);
        }
        .vision-result-table tbody tr:last-child td { border-bottom: 0; }
        .vision-result-table tbody tr:hover td { background: var(--card-code-bg-color); }
        .vision-result-table .num { text-align: right; }
      `}</style>
      <Box overflow="auto" style={{maxHeight: 420}}>
        <table className="vision-result-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={col.align === 'right' ? 'num' : undefined}>
                  <Text
                    size={0}
                    weight="semibold"
                    muted
                    style={{textTransform: 'uppercase', letterSpacing: 0.4}}
                  >
                    {col.label}
                  </Text>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {props.rows.map((row) => (
              <tr key={row._id}>
                {columns.map((col) => (
                  <td key={col.key} className={col.align === 'right' ? 'num' : undefined}>
                    {col.align === 'right' ? (
                      <Code size={1}>{col.get(row)}</Code>
                    ) : (
                      <Text size={1} muted={col.key === 'authorEra'}>
                        {col.get(row)}
                      </Text>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    </Card>
  )
}

/**
 * **Recommended.** A view toggle: the same result projected into a table when the data is a
 * flat list of records. The JSON tree stays for arbitrary shapes; the table is offered when,
 * as here, every row shares a structure. The table borrows the tree's own theme tokens, so
 * it reads as one surface with the rest of the pane. Nothing about the query changes.
 */
export const ShapingRecommended: Story = {
  name: 'Recommended (table projection)',
  tags: ['variant:recommended'],
  render: () => (
    <Card padding={4}>
      <Stack gap={3}>
        <Inline gap={2}>
          <Badge tone="default" padding={2} fontSize={1}>
            Tree
          </Badge>
          <Badge tone="primary" padding={2} fontSize={1}>
            Table
          </Badge>
        </Inline>
        <ResultTable rows={visionBookResults} />
        <AuditNote tone="positive">
          The result is a homogeneous array, so a table is derivable from the keys: rows to scan
          instead of nodes to expand. Header, borders, hover, and the mono value font are the same
          tokens the JSON tree already uses.
        </AuditNote>
      </Stack>
    </Card>
  ),
}
