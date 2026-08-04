import {Card, Flex, Stack} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useRef} from 'react'

// Real component from real source (org contract §8): the params pane that ships under the
// query editor in the Vision tool. Its CodeMirror instance takes JSON; a parse error flips
// the card to critical and hangs the message off the error icon's tooltip.
import {type VisionCodeMirrorHandle} from '../../../../../packages/@sanity/vision/src/codemirror/VisionCodeMirror'
import {ParamsEditor} from '../../../../../packages/@sanity/vision/src/components/ParamsEditor'
import {createMockVisionClient} from '../../../lib/mockVisionClient'
import {WithStudioProviders} from '../../../lib/testProvider'
import {AuditNote, visionSchemaTypes} from '../../../lib/visionStoryKit'

/** Mounts the real `ParamsEditor` (CodeMirror) with a ref, in a bounded card. */
function ParamsPaneDemo(props: {value: string; paramsError?: string; hasValidParams: boolean}) {
  const editorRef = useRef<VisionCodeMirrorHandle>(null)
  return (
    <Card border radius={2} style={{height: 200, display: 'flex'}}>
      <Flex direction="column" flex={1}>
        <ParamsEditor
          value={props.value}
          onChange={() => undefined}
          paramsError={props.paramsError}
          hasValidParams={props.hasValidParams}
          editorRef={editorRef}
        />
      </Flex>
    </Card>
  )
}

const meta: Meta = {
  title: 'Lists & Data/Vision/ParamsEditor',
  parameters: {
    layout: 'fullscreen',
    controls: {include: []},
    docs: {
      description: {
        component: [
          'ParamsEditor validates continuously, unlike the query editor: a parse error flips ' +
            'the whole card critical and disables Fetch, so a malformed object can never reach ' +
            'the API. The catch is where the message lives, inside an icon tooltip, out of reach ' +
            'for anyone navigating by keyboard.',
          '',
          '|        |                                                                                                                                                                                  |',
          '| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |',
          '| Source | `packages/@sanity/vision/src/components/ParamsEditor`, the pane directly under the query editor: a JSON object of the `$params` a GROQ query references (`$minYear`, `$slug`, …) |',
          '| Tier   | SERVICE. The same CodeMirror editor as the query pane, loaded with `paramsExtensions` (JSON, not GROQ)                                                                           |',
          '| Audit  | 🔴 needs-work. The parse-error message lives only in an icon tooltip, reveal-on-hover, unreachable by keyboard                                                                   |',
          '',
          'It is the same CodeMirror editor as the query pane, loaded with `paramsExtensions` ' +
            '(JSON, not GROQ). Unlike the query editor it does validate inline: on a parse error ' +
            'the whole card flips to the critical tone and an error icon appears next to the ' +
            '"Params" label, carrying the parser message in its tooltip. This is the design-law-5 ' +
            'model done right: the params are parsed continuously, but the signal is a quiet ' +
            'icon, not a blocking wall.',
          '',
          '> **Why it matters:** a malformed params object can never reach the API, because ' +
            'Fetch stays disabled while the card reads critical. But the only explanation lives ' +
            'in a tooltip a mouse must hover, so a keyboard-only author sees red and no reason ' +
            'why.',
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

/** Valid params: the real `ParamsEditor`, default tone, no error affordance. */
export const Valid: Story = {
  name: 'Valid params',
  render: () => (
    <Card padding={4}>
      <ParamsPaneDemo value={'{\n  "type": "book",\n  "minYear": 1850\n}'} hasValidParams />
    </Card>
  ),
}

/**
 * Invalid params: the same real `ParamsEditor` with a parse error. The card goes critical
 * and the error icon carries the parser message in its tooltip (hover it). The Fetch button
 * in the full tool is disabled while params are invalid, so a bad `$params` object can never
 * be sent.
 */
export const InvalidJson: Story = {
  name: 'Invalid JSON',
  tags: ['audit:needs-work'],
  render: () => (
    <Card padding={4}>
      <Stack gap={3}>
        <ParamsPaneDemo
          value={'{\n  "type": "book",\n}'}
          paramsError={'Unexpected token } in JSON at position 20'}
          hasValidParams={false}
        />
        <AuditNote>
          The message lives only in the icon tooltip. It is the one legibility snag here: the parser
          message is <code>Text size 1</code> and reveal-on-hover, so a keyboard-only author never
          reads why the params are red.
        </AuditNote>
      </Stack>
    </Card>
  ),
}
