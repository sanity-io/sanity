import {Badge, Card, Code, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

type Level = 'config' | 'schema' | 'editor'

interface Seam {
  path: string
  level: Level
  applies: string
  propsType: string
  storied?: string
}

/**
 * Verified on 2026-07-26 against `core/config/form/types.ts` (the config level),
 * `core/form/types/definitionExtensions.ts` (the schema level) and the first-party
 * consumers in `core/comments` and `core/tasks` (the editor level). Not recalled.
 */
const SEAMS: Seam[] = [
  {
    path: 'form.components.block',
    level: 'config',
    applies: 'Every block in every Portable Text field, INCLUDING plain paragraphs',
    propsType: 'BlockProps',
    storied: 'Portable Text Blocks / 3',
  },
  {
    path: 'form.components.inlineBlock',
    level: 'config',
    applies: 'Every inline object in every Portable Text field',
    propsType: 'BlockProps',
  },
  {
    path: 'form.components.annotation',
    level: 'config',
    applies: 'Every annotation in every Portable Text field',
    propsType: 'BlockAnnotationProps',
  },
  {
    path: 'form.components.portableText.plugins',
    level: 'config',
    applies: 'The editor plugin chain: markdown, paste-link, typography, table',
    propsType: 'PortableTextPluginsProps',
  },
  {
    path: '<blockObjectType>.components.block',
    level: 'schema',
    applies: 'One block object type',
    propsType: 'BlockProps',
    storied: 'Portable Text Blocks / 2',
  },
  {
    path: '<inlineObjectType>.components.inlineBlock',
    level: 'schema',
    applies: 'One inline object type',
    propsType: 'BlockProps',
    storied: 'Portable Text Blocks / 4',
  },
  {
    path: '<annotationType>.components.annotation',
    level: 'schema',
    applies: 'One annotation type',
    propsType: 'BlockAnnotationProps',
    storied: 'Portable Text Marks / 5',
  },
  {
    path: "{type: 'block'}.components.block",
    level: 'schema',
    applies: 'TEXT blocks only, not block objects (per its own docblock)',
    propsType: 'BlockProps',
  },
  {
    path: 'marks.decorators[].component',
    level: 'schema',
    applies: 'One decorator',
    propsType: 'BlockDecoratorProps',
    storied: 'Portable Text Marks / 2',
  },
  {
    path: 'styles[].component',
    level: 'schema',
    applies: 'One block style',
    propsType: 'BlockStyleProps',
    storied: 'Portable Text Marks / 3',
  },
  {
    path: 'lists[].component',
    level: 'schema',
    applies: 'One list type',
    propsType: 'BlockListItemProps',
    storied: 'Portable Text Marks / 4',
  },
  {
    path: 'renderBlock (@portabletext/editor)',
    level: 'editor',
    applies: 'Every block. No form, no renderDefault',
    propsType: 'BlockRenderProps',
  },
  {
    path: 'renderChild (@portabletext/editor)',
    level: 'editor',
    applies: 'Every span and inline object. No form, no renderDefault',
    propsType: 'BlockChildRenderProps',
  },
  {
    path: 'rangeDecorations (prop)',
    level: 'editor',
    applies: 'An arbitrary SELECTION, not a schema type at all',
    propsType: 'RangeDecoration',
  },
]

const LEVEL_TONE: Record<Level, 'primary' | 'positive' | 'caution'> = {
  config: 'primary',
  schema: 'positive',
  editor: 'caution',
}

const LEVEL_BLURB: Record<Level, string> = {
  config:
    'Registered on the workspace. Runs through the form builder, so it receives renderDefault and everything Studio provides. Applies to the whole studio.',
  schema:
    'Registered on a type in the schema. Also runs through the form builder, also receives renderDefault. Scoped to that type. This is the level to reach for.',
  editor:
    'Props passed straight to @portabletext/editor, below the form entirely. No renderDefault, no validation, no presence. Available with or without a document.',
}

function SeamRow({seam}: {seam: Seam}) {
  return (
    <Card border radius={2} padding={3} tone="transparent">
      <Stack gap={3}>
        <Flex align="center" gap={2} wrap="wrap">
          <Code size={1}>{seam.path}</Code>
          <Badge tone={LEVEL_TONE[seam.level]} fontSize={0}>
            {seam.level}
          </Badge>
        </Flex>
        <Text size={1} muted>
          {seam.applies}
        </Text>
        <Flex gap={3} wrap="wrap">
          <Text size={0} muted>
            props: <Code size={0}>{seam.propsType}</Code>
          </Text>
          {seam.storied && (
            <Text size={0} muted>
              storied: {seam.storied}
            </Text>
          )}
        </Flex>
      </Stack>
    </Card>
  )
}

const meta: Meta = {
  title: 'Customisation/Portable Text: Three Levels',
  parameters: {
    docs: {
      description: {
        component: [
          'The question that produced this page was fair: Portable Text ships some default ' +
            'blocks, so what is the precedent for a user-created one? The answer has two halves, ' +
            'and the second half is the one to read before copying the nearest example in the ' +
            'codebase.',
          '',
          '| | |',
          '|---|---|',
          '| Source | the complete inventory of ways to change how Portable Text renders |',
          '| Tier | SERVICE |',
          '| Coverage | fourteen seams across three levels: config, schema, editor |',
          '',
          'Eleven of the fourteen are the documented customisation API and behave the way the ' +
            'rest of this chapter describes: they run through the form builder, they hand you ' +
            '`renderDefault`, and decorating beats replacing. Three of them are not that at all.',
          '',
          '---',
          '',
          "### The finding: Sanity's own custom Portable Text block does not use the seams",
          '',
          'Comments and Tasks both embed a custom `mention` inline object in a Portable Text ' +
            'field. It is the closest thing in the codebase to a first-party worked example, and ' +
            'it is built at the editor level, not through `components.inlineBlock`:',
          '',
          '- `core/comments/components/pte/config.ts` compiles a private schema with ' +
            '`Schema.compile()`, outside the workspace, declaring `mention` and stripping the ' +
            'defaults (`marks: {annotations: []}`, one style, `lists: []`).',
          '- `core/comments/components/pte/render/renderChild.tsx` branches on `value._type === ' +
            "'mention'` and returns a `MentionInlineBlock`, passed to the editor as the " +
            '`renderChild` prop.',
          '- `core/tasks/.../DescriptionInput.tsx` reuses that whole input and adds its own ' +
            '`renderBlock`.',
          '- Inline comment highlights use a third mechanism again, `rangeDecorations`, which ' +
            'attaches to a selection rather than to any schema type.',
          '',
          "It's the correct choice for what those surfaces are. A comment box is a Portable " +
            'Text editor with no document behind it: no form state, no validation, no presence, ' +
            'no patch channel. The eleven schema and config seams are wired *through* the form ' +
            'builder, so a surface with no form cannot reach them. `renderChild` is wired through ' +
            'the editor.',
          '',
          'What it means for anyone reading the codebase for precedent: the nearest first-party ' +
            'example teaches an API you should not use for a document field, and the reason is ' +
            'invisible unless you notice that Comments never mounts a form. If you are adding a ' +
            'custom block to a real document, story 2 of *Portable Text Blocks* is the pattern, ' +
            'not this one.',
          '',
          '---',
          '',
          'Choosing, in one line each: customising one type in a document field uses the schema ' +
            'level, almost always this. A treatment that genuinely belongs on every block ' +
            'everywhere uses the config level, rare, and it catches paragraphs too. Building a ' +
            'Portable Text surface that is not a document field uses the editor level, and accept ' +
            'that you are rebuilding what the form gave you.',
          '',
          '> **Why it matters:** the nearest first-party example in the codebase is not the ' +
            'pattern to copy for a document field. It solves a different problem, an editor with ' +
            'no form behind it, and following it for a real document means silently rebuilding ' +
            'validation, presence and the edit dialog from scratch.',
        ].join('\n'),
      },
    },
  },
  tags: ['autodocs', 'chapter:customisation', 'source:studio-only', 'tier:service'],
}

export default meta
type Story = StoryObj

export const AllSeams: Story = {
  name: 'Every Portable Text seam',
  // Enumeration story: the docs canvas is 540px and this content is 1428px tall, so
  // 888px of it sat below an unscrolled fold on the page a reviewer actually reads.
  parameters: {
    docs: {
      story: {height: '1452px'},
      description: {
        story:
          'All fourteen, in declaration order. Read the level badge first: it tells you whether `renderDefault` is on the table before you read what the seam covers.',
      },
    },
  },
  render: () => (
    <Stack gap={3} style={{maxWidth: 760}}>
      {SEAMS.map((seam) => (
        <SeamRow key={seam.path} seam={seam} />
      ))}
    </Stack>
  ),
}

export const ByLevel: Story = {
  name: 'Grouped by level',
  // Enumeration story: the docs canvas is 540px and this content is 1675px tall, so
  // 1135px of it sat below an unscrolled fold on the page a reviewer actually reads.
  parameters: {
    docs: {
      story: {height: '1699px'},
      description: {
        story:
          'The same inventory, grouped by the distinction that decides what you get for free. Seven of the eleven form-mediated seams are schema level, which is the level most work should happen at and the one least represented in the documentation.',
      },
    },
  },
  render: () => (
    <Stack gap={5} style={{maxWidth: 760}}>
      {(['schema', 'config', 'editor'] as Level[]).map((level) => (
        <Stack key={level} gap={3}>
          <Flex align="center" gap={2}>
            <Badge tone={LEVEL_TONE[level]} fontSize={1}>
              {level}
            </Badge>
            <Text size={0} muted>
              {SEAMS.filter((s) => s.level === level).length} seams
            </Text>
          </Flex>
          <Text size={1} muted>
            {LEVEL_BLURB[level]}
          </Text>
          {SEAMS.filter((s) => s.level === level).map((seam) => (
            <SeamRow key={seam.path} seam={seam} />
          ))}
        </Stack>
      ))}
    </Stack>
  ),
}

export const WhatYouGive: Story = {
  name: 'What each level costs',
  parameters: {
    docs: {
      description: {
        story:
          'The trade, stated plainly. Every row below is something the form builder supplies ' +
          'and the editor level does not, which is what the phrase "below the form" means.',
      },
    },
  },
  render: () => (
    <Stack gap={3} style={{maxWidth: 760}}>
      {[
        [
          'renderDefault',
          'Schema and config only. At editor level there is no default to delegate to.',
        ],
        ['Validation markers', 'Schema and config only. The editor has no validator.'],
        ['Presence and change indicators', 'Schema and config only. Both are form-store concerns.'],
        ['open / onOpen / onClose', 'Schema and config only. The edit dialog is form machinery.'],
        ['Scoped to a type', 'Schema only. Config sees everything; editor branches by hand.'],
        ['Works without a document', 'Editor only. This is the reason the level exists.'],
        [
          'Attaches to a selection rather than a type',
          'Editor only, via rangeDecorations. Nothing at the other two levels can do this.',
        ],
      ].map(([what, where]) => (
        <Card key={what} border radius={2} padding={3} tone="transparent">
          <Stack gap={2}>
            <Text size={1} weight="medium">
              {what}
            </Text>
            <Text size={1} muted>
              {where}
            </Text>
          </Stack>
        </Card>
      ))}
    </Stack>
  ),
}
