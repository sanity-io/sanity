import {Badge, Card, Code, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

type Shape = 'renderDefault' | 'description' | 'whole surface' | 'dead'

interface Seam {
  path: string
  controls: string
  shape: Shape
  storied?: string
}

/**
 * Every seam verified on 2026-07-26 rather than recalled.
 *
 * The FORM group is read from `core/config/form/types.ts` and
 * `core/form/types/definitionExtensions.ts`. The STUDIO group is read from
 * `studio-components-hooks/picks.ts` rather than from the config types, because the types are
 * wrong in both directions: they still declare `logo`, which has no pick function and no
 * consumer (ledger #61), and they were the reason `activeToolLayout` was missing from this
 * inventory entirely (ledger #62). A seam exists when something picks it, not when something
 * types it.
 */
const SEAMS: Seam[] = [
  {
    path: 'form.components.input',
    controls: 'How a field is edited',
    shape: 'renderDefault',
    storied: 'Customisation/Custom Input',
  },
  {
    path: 'form.components.field',
    controls: 'The label, description and validation around an input',
    shape: 'renderDefault',
    storied: 'Customisation/Custom Field',
  },
  {
    path: 'form.components.item',
    controls: 'A single row inside an array',
    shape: 'renderDefault',
    storied: 'Customisation/Custom Item',
  },
  {
    path: 'form.components.preview',
    controls: 'How a document is summarised in lists and references',
    shape: 'renderDefault',
    storied: 'Customisation/Custom Preview',
  },
  {
    path: 'form.components.block / inlineBlock',
    controls: 'A block inside Portable Text',
    shape: 'renderDefault',
    storied: 'Customisation/Portable Text Blocks',
  },
  {
    path: 'form.components.annotation',
    controls: 'An annotation on Portable Text (a link, say)',
    shape: 'renderDefault',
    storied: 'Customisation/Portable Text Marks',
  },
  {
    path: 'marks.decorators[] / styles[] / lists[] .component',
    controls: 'One decorator, block style or list type. Schema-level only',
    shape: 'renderDefault',
    storied: 'Customisation/Portable Text Marks',
  },
  {
    path: 'form.components.portableText.plugins',
    controls: 'Editor plugins for Portable Text',
    shape: 'whole surface',
  },
  {
    path: 'renderBlock / renderChild / rangeDecorations',
    controls: 'Portable Text below the form. What Comments and Tasks actually use',
    shape: 'whole surface',
    storied: 'Customisation/Portable Text: Three Levels',
  },
  {
    path: 'studio.components.navbar',
    controls: 'The top bar: search, presence, new document, workspaces, perspective',
    shape: 'renderDefault',
    storied: 'Navbar & Shell/*',
  },
  {
    path: 'studio.components.logo',
    controls: 'NOTHING. Typed and deprecated, but no pick function and no consumer (ledger #61)',
    shape: 'dead',
    storied: 'Navbar & Shell/Studio Logo',
  },
  {
    path: 'studio.components.toolMenu',
    controls: 'The tool switcher',
    shape: 'renderDefault',
  },
  {
    path: 'studio.components.activeToolLayout',
    controls: "The active tool's render area",
    shape: 'renderDefault',
  },
  {
    path: 'studio.components.layout',
    controls: 'The whole studio shell',
    shape: 'renderDefault',
  },
  {
    path: 'document.components.unstable_layout',
    controls: 'The whole document pane',
    shape: 'renderDefault',
  },
  {
    path: 'document.actions',
    controls: 'What an editor can DO to a document',
    shape: 'description',
    storied: 'Customisation/Document Actions',
  },
  {
    path: 'document.badges',
    controls: 'Status pills on a document',
    shape: 'description',
    storied: 'Customisation/Document Badges',
  },
  {
    path: 'tools',
    controls: 'Whole top-level surfaces',
    shape: 'whole surface',
  },
  {
    path: 'structure (S.list()…)',
    controls: 'The pane hierarchy of the structure tool',
    shape: 'whole surface',
    storied: 'Document Pane/Pane Layout',
  },
]

const SHAPE_TONE: Record<Shape, 'primary' | 'caution' | 'default' | 'critical'> = {
  'renderDefault': 'primary',
  'description': 'caution',
  'whole surface': 'default',
  'dead': 'critical',
}

function SeamRow({seam}: {seam: Seam}) {
  return (
    <Card border radius={2} padding={3} tone="transparent">
      <Stack gap={3}>
        <Flex align="center" gap={2} wrap="wrap">
          <Code size={1}>{seam.path}</Code>
          <Badge tone={SHAPE_TONE[seam.shape]} fontSize={0}>
            {seam.shape}
          </Badge>
        </Flex>
        <Text size={1} muted>
          {seam.controls}
        </Text>
        {seam.storied && (
          <Text size={0} muted>
            storied: {seam.storied}
          </Text>
        )}
      </Stack>
    </Card>
  )
}

const meta: Meta = {
  title: 'Customisation/The Seams',
  parameters: {
    docs: {
      description: {
        component: [
          'Sanity has two working customisation shapes, and mistaking one for the other is the ' +
            'most common way to get stuck. This is the map: every point at which a Sanity Studio ' +
            'can be reshaped, what each one controls, and which shape it has.',
          '',
          '|          |                                                                                                                              |',
          '| -------- | ---------------------------------------------------------------------------------------------------------------------------- |',
          '| Source   | every customisation seam in Studio, verified against `picks.ts` and the form/definition-extension types rather than recalled |',
          '| Tier     | SERVICE                                                                                                                      |',
          '| Coverage | 19 seams across four shapes: renderDefault, description, whole surface, dead                                                 |',
          '',
          '`renderDefault` seams hand you the default component as a prop and ask for JSX back. ' +
            'You are not given an empty slot; you are given the thing Studio would have rendered. ' +
            "So the normal move is to decorate, wrap the default and add to it, and Studio's own " +
            'components stay the substrate of your customisation. This is by far the larger ' +
            'group.',
          '',
          'Description seams, `document.actions` and `document.badges`, do the opposite. You ' +
            'return data, not markup, and Studio renders it. There is no `renderDefault` to wrap; ' +
            'the equivalent move is to call the thing you are extending and spread its ' +
            'description. That shape exists because one action must render as a button, a menu ' +
            'row and a palette entry, and should look native in all three without the author ' +
            'knowing which context it landed in.',
          '',
          'Whole-surface seams, tools, structure, Portable Text plugins, are neither. You are ' +
            'building something new rather than altering something existing.',
          '',
          'And one dead row, which is not a fourth shape so much as a warning. ' +
            '`studio.components.logo` is still declared on both public interfaces and still ' +
            'carries a deprecation notice pointing at workspace `icon`, but nothing picks it and ' +
            'nothing consumes it. Registering it has no effect and produces no error. Ledger #61.',
          '',
          'A note on where this list comes from: the studio rows are read from `picks.ts` ' +
            'rather than from the config types, because the types over-report in one place and ' +
            'under-report in another. A seam exists when something picks it. The public type is ' +
            'not the inventory.',
          '',
          'Every page in this chapter is measured against a default that the chapters above ' +
            'already story. The docs already say customisation is possible; this chapter shows ' +
            'what each choice costs, side by side on the same document.',
          '',
          '> **Why it matters:** skip `renderDefault` on a renderDefault seam and you inherit ' +
            'nothing. Validation, presence, change indicators, and read-only handling all stop, ' +
            "because they were the default's doing, not something the seam itself provides.",
        ].join('\n'),
      },
    },
  },
  tags: ['autodocs', 'chapter:customisation', 'source:studio-only', 'tier:service'],
}

export default meta
type Story = StoryObj

export const AllSeams: Story = {
  name: 'Every seam',
  // Enumeration story: the docs canvas is 540px and this content is 1681px tall, so
  // 1141px of it sat below an unscrolled fold on the page a reviewer actually reads.
  parameters: {
    docs: {
      story: {height: '1705px'},
      description: {
        story:
          'The full inventory, read from the pick functions and the definition extensions rather than recalled. Read the badges first: the shape tells you which move to reach for before you read what the seam controls, and one badge tells you not to bother.',
      },
    },
  },
  render: () => (
    <Stack gap={3} style={{maxWidth: 720}}>
      {SEAMS.map((seam) => (
        <SeamRow key={seam.path} seam={seam} />
      ))}
    </Stack>
  ),
}

export const ByShape: Story = {
  name: 'Grouped by shape',
  // Enumeration story: the docs canvas is 540px and this content is 1857px tall, so
  // 1317px of it sat below an unscrolled fold on the page a reviewer actually reads.
  parameters: {
    docs: {
      story: {height: '1881px'},
      description: {
        story: [
          'The same inventory, sorted by the distinction that decides how you write the code. ' +
            'The large majority hand you `renderDefault`. That is where "decorate, do not ' +
            'replace" comes from, and why the two description seams surprise people when they ' +
            'turn out to have no default to delegate to.',
          '',
          'Read `Customisation/The Middleware Chain` alongside this, because it qualifies the ' +
            "whole group: `renderDefault` means _the next registrant down_, not _Sanity's " +
            'component_, and on a studio with plugins installed those are different things.',
        ].join('\n'),
      },
    },
  },
  render: () => (
    <Stack gap={5} style={{maxWidth: 720}}>
      {(['renderDefault', 'description', 'whole surface', 'dead'] as Shape[]).map((shape) => (
        <Stack key={shape} gap={3}>
          <Flex align="center" gap={2}>
            <Badge tone={SHAPE_TONE[shape]} fontSize={1}>
              {shape}
            </Badge>
            <Text size={0} muted>
              {SEAMS.filter((s) => s.shape === shape).length} seams
            </Text>
          </Flex>
          {SEAMS.filter((s) => s.shape === shape).map((seam) => (
            <SeamRow key={seam.path} seam={seam} />
          ))}
        </Stack>
      ))}
    </Stack>
  ),
}

export const Coverage: Story = {
  name: 'What this chapter covers so far',
  parameters: {
    docs: {
      description: {
        story:
          'Honest state of the chapter, regenerated from the table above rather than maintained by hand.\n\nThe form seams are now worked end to end: `input`, `field`, `item`, `preview`, and Portable Text across three pages. What remains has no comparison page yet: the studio chrome seams (`navbar`, `logo`, `toolMenu`, `layout`, `unstable_layout`), whose defaults are storied in `Navbar & Shell` but never set against a customised version, and the two whole-surface seams, which are less a customisation than a construction and may be better served by the chapters that already story them.',
      },
    },
  },
  render: () => (
    <Stack gap={4} style={{maxWidth: 720}}>
      <Stack gap={3}>
        <Text size={1} weight="medium">
          Worked page in this chapter
        </Text>
        {SEAMS.filter((s) => s.storied?.startsWith('Customisation')).map((seam) => (
          <SeamRow key={seam.path} seam={seam} />
        ))}
      </Stack>
      <Stack gap={3}>
        <Text size={1} weight="medium">
          Default storied elsewhere, no comparison yet
        </Text>
        {SEAMS.filter((s) => s.storied && !s.storied.startsWith('Customisation')).map((seam) => (
          <SeamRow key={seam.path} seam={seam} />
        ))}
      </Stack>
      <Stack gap={3}>
        <Text size={1} weight="medium">
          Not yet covered
        </Text>
        {SEAMS.filter((s) => !s.storied).map((seam) => (
          <SeamRow key={seam.path} seam={seam} />
        ))}
      </Stack>
    </Stack>
  ),
}
