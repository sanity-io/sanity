import {Box, Card, Code, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode} from 'react'

// Real components from real source (org contract §8): the Vision result pane in its error
// state (`VisionGuiResult` → `QueryErrorDialog` → `QueryErrorDetails`), mounted unmodified
// with a Content Lake-shaped GROQ error.
import {QueryErrorDialog} from '../../../../../packages/@sanity/vision/src/components/QueryErrorDialog'
import {VisionGuiResult} from '../../../../../packages/@sanity/vision/src/components/VisionGuiResult'
import {createMockVisionClient} from '../../../lib/mockVisionClient'
import {WithStudioProviders} from '../../../lib/testProvider'
import {
  AuditNote,
  groqSyntaxError,
  ResultFrame,
  VISION_DATASET,
  visionSchemaTypes,
} from '../../../lib/visionStoryKit'

const meta: Meta = {
  title: 'Lists & Data/Vision/Errors',
  parameters: {
    layout: 'fullscreen',
    controls: {include: []},
    docs: {
      description: {
        component: [
          "This page covers Vision's GROQ error rendering. The message prints smaller than the " +
            'result it just replaced, exactly when a query fails and a person most needs to read ' +
            'it clearly.',
          '',
          '|          |                                                                                                                          |',
          '| -------- | ------------------------------------------------------------------------------------------------------------------------ |',
          '| Source   | `QueryErrorDialog` → `QueryErrorDetails`, the GROQ error rendering, shown inside the real `VisionGuiResult`              |',
          '| Tier     | SERVICE. Part of the Vision GROQ playground: the result pane’s error state                                               |',
          '| Audit    | 🔴 needs-work (design law 8). Error text renders at `Code size 1` (13px), one step below the `size 2` (15px) it replaces |',
          '| Measured | query editor 13px = error message 13px, successful result 15px; Recommended lifts the message to `size 2`                |',
          '',
          'When a query fails the result pane turns critical and prints the message, then a ' +
            'caret line pointing at the offending token, then the line and column.',
          '',
          '<details>',
          '<summary><b>The error text renders one step smaller than the result it ' +
            'replaces.</b></summary>',
          '',
          'The error text renders through `ErrorCode`, `@sanity/ui` `Code size={1}`, 13px ' +
            '(`fonts.code.sizes[1]`). That is the same size as the query editor (also `sizes[1]`, ' +
            '13px), but one step below a successful result, which the tree renders at `sizes[2]`, ' +
            '15px. The moment a query fails, the pane that was showing 15px content swaps to 13px ' +
            'content, and the error, the thing most needing to be read, is set smaller than the ' +
            'result it replaced. The error color is also `--card-muted-fg-color` on a critical ' +
            'card, a muted foreground, so at equal-or-smaller px it reads weaker still. The ' +
            'Recommended story sets the message at `size={2}` (15px) to match the result ' +
            'register.',
          '',
          '</details>',
          '',
          '> **Why it matters:** the error prints smaller than the result it replaces, 13px ' +
            'against the tree’s 15px, in a muted foreground on a critical card. The instant a ' +
            'query fails, the thing most needing to be read becomes the least legible thing on ' +
            'screen. The Recommended story lifts it back to match.',
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
  tags: ['autodocs', 'chapter:data', 'source:studio-only', 'tier:service'],
}

export default meta
type Story = StoryObj

/**
 * The real error path: a Content Lake-shaped GROQ syntax error handed to the shipped
 * `VisionGuiResult`. The pane turns critical, the message shows, and the caret line points
 * at the offending token, the component's own error rendering, unmodified.
 */
export const ErrorDisplay: Story = {
  name: 'Error display (real GROQ error)',
  render: () => (
    <Card padding={4}>
      <ResultFrame height={360}>
        <VisionGuiResult
          queryInProgress={false}
          listenInProgress={false}
          listenMutations={[]}
          dataset={VISION_DATASET}
          queryResult={undefined}
          error={groqSyntaxError}
          queryTime={undefined}
          e2eTime={undefined}
        />
      </ResultFrame>
    </Card>
  ),
}

/** One measured register: a label, a real Code swatch at the given size, and the px number. */
function MeasuredRegister(props: {
  label: string
  codeSize: 1 | 2
  px: number
  tone?: 'critical' | 'default'
  children: ReactNode
}) {
  return (
    <Card border radius={2} padding={3} tone={props.tone}>
      <Flex align="center" gap={4}>
        <Box style={{width: 190, flexShrink: 0}}>
          <Text size={1} weight="semibold">
            {props.label}
          </Text>
          <Box marginTop={1}>
            <Text size={0} muted>
              code size {props.codeSize} · {props.px}px
            </Text>
          </Box>
        </Box>
        <Box flex={1} style={{minWidth: 0}}>
          <Code size={props.codeSize}>{props.children}</Code>
        </Box>
      </Flex>
    </Card>
  )
}

/**
 * **Evidence device (design law 2).** The three code registers of the tool, each a real
 * `@sanity/ui` Code swatch at its actual shipped size, stacked so the step is visible. The
 * query editor and the error message sit at the same 13px; a successful result prints at
 * 15px. Read top to bottom: the error is set one step below the result it replaces.
 */
export const SizeLedger: Story = {
  name: 'Error-size ledger (measured)',
  tags: ['audit:needs-work'],
  render: () => (
    <Card padding={4}>
      <Stack gap={4} style={{maxWidth: 820, marginInline: 'auto'}}>
        <Stack gap={3}>
          <MeasuredRegister label="Query editor" codeSize={1} px={13}>
            *[_type == "book" && year &gt; $minYear]
          </MeasuredRegister>
          <MeasuredRegister label="Error message" codeSize={1} px={13} tone="critical">
            Syntax error in GROQ query: expected expression, got &apos;]&apos;
          </MeasuredRegister>
          <MeasuredRegister label="Successful result (tree)" codeSize={2} px={15}>
            {'{ "title": "Anna Karenina", "year": 1878 }'}
          </MeasuredRegister>
        </Stack>
        <AuditNote>
          The error is <code>ErrorCode</code> = <code>Code size 1</code> (13px), equal to the query
          editor, and 2px below the 15px result it replaces. Because it also uses the muted critical
          foreground, it reads weaker than its size alone would suggest.
        </AuditNote>
      </Stack>
    </Card>
  ),
}

/**
 * **Recommended.** The identical `QueryErrorDialog` markup, but the message register lifted
 * to `size={2}` (15px) so the error prints at the same size as the result it replaces. The
 * caret and line/column detail stay at size 1 (they are secondary), but the headline message
 * no longer shrinks on failure. Shown next to the current size-1 rendering for comparison.
 */
export const SizeRecommended: Story = {
  name: 'Recommended (message at result size)',
  tags: ['variant:recommended'],
  render: () => (
    <Card padding={4}>
      <Stack gap={4} style={{maxWidth: 820, marginInline: 'auto'}}>
        <Stack gap={2}>
          <Text size={1} muted weight="medium">
            Current: message at 13px (code size 1)
          </Text>
          <Card border radius={2} padding={4} tone="critical">
            <QueryErrorDialog error={groqSyntaxError} />
          </Card>
        </Stack>
        <Stack gap={2}>
          <Text size={1} muted weight="medium">
            Recommended: message at 15px (code size 2), caret / line-column unchanged
          </Text>
          <Card border radius={2} padding={4} tone="critical">
            <Stack gap={5} marginTop={2}>
              <Code size={2}>{groqSyntaxError.message}</Code>
              <Code size={1}>{'  && ]{ title }\n------^'}</Code>
              <Code size={1}>{'Line:   2\nColumn: 6'}</Code>
            </Stack>
          </Card>
        </Stack>
        <AuditNote tone="positive">
          A one-token change: <code>ErrorCode size 1 → size 2</code> for the message. The error now
          holds the same register as a result, so failure no longer means smaller text.
        </AuditNote>
      </Stack>
    </Card>
  ),
}
