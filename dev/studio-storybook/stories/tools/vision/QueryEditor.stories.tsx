import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode} from 'react'

// Real component from real source (org contract §8): the GROQ query editor that ships
// inside the Vision tool — CodeMirror with the `groqExtensions` language pack. Mounted
// unmodified; the different states are just different `initialValue`s.
import {groqExtensions} from '../../../../../packages/@sanity/vision/src/codemirror/extensions'
import {VisionCodeMirror} from '../../../../../packages/@sanity/vision/src/codemirror/VisionCodeMirror'
import {createMockVisionClient} from '../../../lib/mockVisionClient'
import {WithStudioProviders} from '../../../lib/testProvider'
import {AuditNote, visionSchemaTypes} from '../../../lib/visionStoryKit'

const noop = () => undefined

/**
 * The query editor in a bounded card with the tool's own "Query" gutter label, so the
 * editor's own chrome (line padding, gutter, syntax palette) reads the way it does in the
 * tool. The editor is height-driven, so the frame fixes a height.
 */
function EditorFrame(props: {label: string; children: ReactNode; height?: number}) {
  return (
    <Card
      border
      radius={2}
      overflow="hidden"
      style={{height: props.height ?? 220, display: 'flex'}}
    >
      <Flex direction="column" flex={1}>
        <Card padding={3} paddingBottom={2} borderBottom tone="transparent">
          <Text
            size={0}
            muted
            weight="medium"
            style={{textTransform: 'uppercase', letterSpacing: 0.4}}
          >
            {props.label}
          </Text>
        </Card>
        <Flex direction="column" flex={1}>
          {props.children}
        </Flex>
      </Flex>
    </Card>
  )
}

const meta: Meta = {
  title: 'Lists & Data/Vision/QueryEditor',
  parameters: {
    layout: 'fullscreen',
    controls: {include: []},
    docs: {
      description: {
        component: [
          'QueryEditor has no inline diagnostics layer: a bad query prints no underline, no ' +
            'gutter marker, nothing at all, until it is run. That gap is deliberate, but it means ' +
            'a typo hides in plain sight until execution.',
          '',
          '|        |                                                                                                                                                        |',
          '| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |',
          '| Source | `packages/@sanity/vision/src/codemirror/VisionCodeMirror`, mounted with `groqExtensions`; the top-left pane of the Vision tool                         |',
          '| Tier   | SERVICE. CodeMirror 6, monospace, real GROQ syntax highlighting, tool font at `Code size 1` (13px, `fonts.code.sizes[1]`, set in `useCodemirrorTheme`) |',
          '| Audit  | 🔴 needs-work. No inline diagnostics: a typo is invisible until Fetch surfaces it as a critical result on the Errors page (design law 5, deliberate)   |',
          '',
          'It is a CodeMirror 6 editor: monospace, real GROQ syntax highlighting (keywords, ' +
            'strings, numbers, the projection braces). A syntax error is only reported after ' +
            'Fetch, as a critical state in the result pane.',
          '',
          '> **Why it matters:** unlike the params pane one tab over, nothing here flags a bad ' +
            'query before Fetch. The gap is deliberate, since validating a query mid-type would ' +
            'be premature, but it means a typo waits silently for execution to reveal it.',
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

/** The editor on open: empty, cursor-ready, gutter label present, no placeholder text. */
export const Empty: Story = {
  name: 'Empty (nothing typed)',
  render: () => (
    <Card padding={4}>
      <EditorFrame label="Query">
        <VisionCodeMirror initialValue={''} onChange={noop} extensions={groqExtensions} />
      </EditorFrame>
    </Card>
  ),
}

/** A real dereferencing query: the highlighter colors the type filter and projection. */
export const WithQuery: Story = {
  name: 'With a query (live editing)',
  render: () => (
    <Card padding={4}>
      <Stack gap={3}>
        <EditorFrame label="Query">
          <VisionCodeMirror
            initialValue={'*[_type == "book"]{\n  title,\n  year,\n  author->{name, era}\n}'}
            onChange={noop}
            extensions={groqExtensions}
          />
        </EditorFrame>
        <AuditNote tone="positive">
          The editor is live: type, select, and edit. Highlighting updates as you go. Press
          Ctrl/Cmd+Enter inside the full tool (the In Context page) to run it.
        </AuditNote>
      </Stack>
    </Card>
  ),
}

/**
 * A query that exercises the whole GROQ syntax palette: filters, operators, functions,
 * parameters, slices, ordering, projections, so every highlight color in the theme is on
 * screen at once. This is the syntax-coloring audit surface.
 */
export const SyntaxColoring: Story = {
  name: 'Syntax coloring (full palette)',
  render: () => (
    <Card padding={4}>
      <EditorFrame label="Query" height={280}>
        <VisionCodeMirror
          initialValue={[
            '*[_type == "book" && year >= $minYear && defined(author)]',
            '| order(year desc) [0...10] {',
            '  "id": _id,',
            '  title,',
            '  year,',
            '  "isClassic": year < 1900,',
            '  author->{name, era},',
            '  "wordCount": count(chapters)',
            '}',
          ].join('\n')}
          onChange={noop}
          extensions={groqExtensions}
        />
      </EditorFrame>
    </Card>
  ),
}

/**
 * **Audit finding: no inline validation.** A syntactically broken query (an empty
 * right-hand operand before `]`). The editor renders it in neutral tone with no underline,
 * no gutter marker, no message: invalidity is invisible here. It surfaces only after
 * Fetch, in the result pane (the **Errors** page). Correct by law 5 (do not validate
 * mid-type), but there is no lint affordance at all, so the author gets no earlier signal.
 */
export const Invalid: Story = {
  name: 'Invalid query (no inline signal)',
  tags: ['audit:needs-work'],
  render: () => (
    <Card padding={4}>
      <Stack gap={3}>
        <EditorFrame label="Query">
          <VisionCodeMirror
            initialValue={'*[_type == "book"\n  && ]{ title }'}
            onChange={noop}
            extensions={groqExtensions}
          />
        </EditorFrame>
        <AuditNote>
          The query is broken (empty operand before <code>]</code>), yet the editor shows no
          diagnostic. Compare the Params editor, which does surface a parse error inline. GROQ
          errors appear only in the result pane after Fetch.
        </AuditNote>
      </Stack>
    </Card>
  ),
}
