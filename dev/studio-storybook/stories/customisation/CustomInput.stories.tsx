import {Badge, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {type InputProps} from '../../../../packages/sanity/src/core/form/types/inputProps'
import {FormBuilderHarness} from '../../lib/formBuilderHarness'
import {WithStudioProviders} from '../../lib/testProvider'

/**
 * One schema, reused by all three stories, so the ONLY difference between them is the
 * `form.components.input` entry in the config. That is the point of the page: same document,
 * same fields, three customisation choices.
 */
const schemaTypes = [
  {
    name: 'article',
    title: 'Article',
    type: 'document',
    fields: [
      {name: 'title', title: 'Title', type: 'string'},
      {
        name: 'summary',
        title: 'Summary',
        type: 'text',
        description: 'Shown in listings and search results.',
        validation: (rule: {max: (n: number) => unknown}) => rule.max(60),
      },
      {name: 'readingTime', title: 'Reading time (minutes)', type: 'number'},
    ],
  },
]

const baseConfig = {
  name: 'default',
  title: 'Acme Content',
  schema: {name: 'default', types: schemaTypes},
}

/**
 * DECORATION. Calls `renderDefault(props)` and wraps the result.
 *
 * Everything Studio does for an input - validation markers, presence avatars, change indicators,
 * read-only handling, focus paths - keeps working, because the default is still the thing doing
 * the rendering. This component only adds a frame around it.
 */
function WrappedInput(props: InputProps) {
  return (
    <Card border radius={2} padding={3} tone="primary">
      <Stack gap={3}>
        <Flex align="center" gap={2}>
          <Badge tone="primary" fontSize={0}>
            custom
          </Badge>
          <Text size={0} muted>
            wrapped with renderDefault
          </Text>
        </Flex>
        {props.renderDefault(props)}
      </Stack>
    </Card>
  )
}

/**
 * REPLACEMENT. Never calls `renderDefault`, so nothing Studio provides survives.
 *
 * Deliberately naive: it handles the value and the change, and nothing else. Compare it with the
 * story above on the same document and the cost is visible rather than described.
 */
function ReplacedInput(props: InputProps) {
  const value = (props as {value?: unknown}).value
  const onChange = (props as {onChange?: (patch: unknown) => void}).onChange

  return (
    <Card border radius={2} padding={3} tone="critical">
      <Stack gap={3}>
        <Flex align="center" gap={2}>
          <Badge tone="critical" fontSize={0}>
            replaced
          </Badge>
          <Text size={0} muted>
            renderDefault never called
          </Text>
        </Flex>
        <TextInput
          value={typeof value === 'string' ? value : String(value ?? '')}
          onChange={(event) => {
            // A real replacement would emit a proper PatchEvent. This one is deliberately thin.
            onChange?.({type: 'set', path: [], value: event.currentTarget.value})
          }}
        />
      </Stack>
    </Card>
  )
}

const meta: Meta = {
  title: 'Customisation/Custom Input',
  parameters: {
    docs: {
      description: {
        component: [
          'InputProps carries a renderDefault function, and that single prop is the difference ' +
            "between Sanity's customisation model and the usual one: you're handed the default " +
            'component as an argument, not an empty slot.',
          '',
          '|      |                                                            |',
          '| ---- | ---------------------------------------------------------- |',
          '| Seam | `form.components.input`, typed `ComponentType<InputProps>` |',
          '| Tier | SERVICE                                                    |',
          '',
          "The normal move is to decorate rather than replace, so the studio's own components " +
            'remain the substrate of your customisation rather than something you route around. ' +
            'This is the most common UI customisation in Sanity, replacing how a field is ' +
            'rendered, shown three ways against the same document so the trade is visible.',
          '',
          'The three stories below are the same schema and the same document. The only thing ' +
            'that changes is the `form.components.input` entry in the workspace config, and that ' +
            'config is the real one, resolved by `createWorkspaceFromConfig` exactly as a studio ' +
            'would. Nothing here is simulated.',
          '',
          'Read them in order. Default shows what Studio gives you. Wrapped shows that ' +
            'decorating costs you nothing. Replaced shows what you are actually signing up for ' +
            'when you skip `renderDefault`: the validation marker on Summary disappears, and so ' +
            'does everything else Studio was doing on your behalf.',
          '',
          '> **Why it matters:** decorate rather than replace whenever you can. The default ' +
            'component handed to you as an argument is the substrate every other Studio behaviour ' +
            'is built on, and skipping it silently removes capability nothing else warns you ' +
            'about, not just the look.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:customisation',
    'chapter:forms',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

const DOC = {
  _id: 'article-launch',
  _type: 'article',
  title: 'The quiet rise of structured content',
  summary:
    'A summary deliberately longer than the sixty characters this field allows, so the validation marker has something to say.',
  readingTime: 6,
}

export const Default: Story = {
  name: '1. Default - what Studio gives you',
  decorators: [WithStudioProviders({config: baseConfig})],
  parameters: {
    docs: {
      description: {
        story:
          'No customisation at all. Note what is here without anyone asking: field titles and descriptions, a validation marker on Summary because the value exceeds its `max(60)` rule, correct input types per field, and the change-indicator gutter down the left.\n\nThis is the baseline the next two stories are measured against.',
      },
    },
  },
  render: () => <FormBuilderHarness documentType="article" initialDocument={DOC} height={420} />,
}

export const Wrapped: Story = {
  name: '2. Wrapped - decorating with renderDefault',
  decorators: [
    WithStudioProviders({
      config: {...baseConfig, form: {components: {input: WrappedInput}}} as never,
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "The same form with a custom input that calls `props.renderDefault(props)` inside a frame. Every field now sits in a tinted card with a badge.\n\n**And nothing was lost.** The validation marker on Summary is still there, the descriptions are still there, the change indicators still work - because the default component is still doing the rendering and the customisation is only wrapping it. Fourteen lines of component for a studio-wide visual change with zero reimplementation.\n\nNote it applies to *every* input including nested ones, which is why the whole form is framed rather than one field. Scoping a customisation to one field is done on the schema type instead, via that type's own `components.input`.",
      },
    },
  },
  render: () => <FormBuilderHarness documentType="article" initialDocument={DOC} height={520} />,
}

export const Replaced: Story = {
  name: '3. Replaced - what skipping renderDefault costs',
  decorators: [
    WithStudioProviders({
      config: {...baseConfig, form: {components: {input: ReplacedInput}}} as never,
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'The same form again, with an input that never calls `renderDefault`. Compare it against story 1 field by field.\n\n**Gone:** the validation marker on Summary. The field descriptions. The per-type inputs - the number field is now a text box. The change indicators. Read-only handling, presence, and focus-path behaviour, none of which are visible here but all of which have stopped working.\n\nNone of that is a bug in the replacement; it is simply everything the default was providing, and a replacement inherits none of it. That is the honest cost of the seam, and the reason `renderDefault` exists.\n\nThere are legitimate reasons to replace outright - a genuinely different editing surface for a field type, say - but it should be a decision made against this list rather than the default reflex.',
      },
    },
  },
  render: () => <FormBuilderHarness documentType="article" initialDocument={DOC} height={480} />,
}
