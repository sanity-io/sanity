import {Badge, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {type FieldProps} from '../../../../packages/sanity/src/core/form/types/fieldProps'
import {FormBuilderHarness} from '../../lib/formBuilderHarness'
import {WithStudioProviders} from '../../lib/testProvider'

/**
 * The same schema as `Customisation/Custom Input`, deliberately: the two pages are meant to be
 * read as a pair, and using one document across both makes the layering visible. `summary` has
 * a `max(60)` rule and a description so the field chrome has both a description and a
 * validation marker to render. `credits` is an object so the collapse affordance appears,
 * which is a FIELD concern rather than an input one.
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
      {
        name: 'credits',
        title: 'Credits',
        type: 'object',
        description: 'Who worked on this.',
        options: {collapsible: true, collapsed: false},
        fields: [
          {name: 'author', title: 'Author', type: 'string'},
          {name: 'editor', title: 'Editor', type: 'string'},
        ],
      },
    ],
  },
]

const baseConfig = {
  name: 'default',
  title: 'Acme Content',
  schema: {name: 'default', types: schemaTypes},
}

/**
 * DECORATION. `props.children` is the INPUT; `renderDefault(props)` is the input plus all the
 * chrome around it. Wrapping the latter keeps the chrome and adds to it.
 */
function AnnotatedField(props: FieldProps) {
  return (
    <Card border radius={2} padding={3} tone="primary">
      <Stack gap={3}>
        <Flex align="center" gap={2}>
          <Badge tone="primary" fontSize={0}>
            field
          </Badge>
          <Text size={0} muted>
            level {props.level} · {props.name} · {props.changed ? 'changed' : 'unchanged'}
          </Text>
        </Flex>
        {props.renderDefault(props)}
      </Stack>
    </Card>
  )
}

/**
 * REPLACEMENT. Renders `props.children` (the input) and a title, and nothing else. Everything
 * the default field layer was contributing is now absent, which is the point of the story.
 */
function BareField(props: FieldProps) {
  return (
    <Card border radius={2} padding={3} tone="critical">
      <Stack gap={3}>
        <Flex align="center" gap={2}>
          <Badge tone="critical" fontSize={0}>
            replaced
          </Badge>
          <Text size={1} weight="medium">
            {props.title}
          </Text>
        </Flex>
        {props.children}
      </Stack>
    </Card>
  )
}

const DOC = {
  _id: 'article-launch',
  _type: 'article',
  title: 'The quiet rise of structured content',
  summary:
    'A summary deliberately longer than the sixty characters this field allows, so the validation marker has something to say.',
  credits: {author: 'Ada Okonkwo', editor: 'Bo Lindqvist'},
}

const meta: Meta = {
  title: 'Customisation/Custom Field',
  parameters: {
    docs: {
      description: {
        component: [
          'A custom input that appears inside a box nobody wrote is the field: the layer between ' +
            'the form and the input that carries the label, description, validation message, ' +
            'presence avatars, change indicator, and collapse affordance around whatever renders ' +
            'inside it.',
          '',
          '| | |',
          '|---|---|',
          '| Seam | `form.components.field`, typed `ComponentType<FieldProps>` |',
          '| Tier | SERVICE |',
          '',
          'The prop that tells you which layer you are on: `FieldProps.children` is the rendered ' +
            'input. `InputProps` has no equivalent, because there is nothing below an input. If the ' +
            'component you are writing receives `children` that already look like a form control, ' +
            'you are writing a field.',
          '',
          'And the giveaway that this layer owns more than decoration: `ObjectFieldProps` carries ' +
            '`collapsed`, `collapsible`, `onCollapse` and `onExpand`. Collapsing an object is a field ' +
            'behaviour, not an input one, so a replaced field on a collapsible object silently ' +
            'removes the ability to collapse it. Story 3 shows that happening.',
          '',
          'Same schema, same document, three registrations. This page is the sibling of ' +
            '`Customisation/Custom Input` and uses the same document on purpose.',
          '',
          '> **Why it matters:** read this page if you have ever wondered why a custom input ' +
            'appeared inside a box you did not write. That box is the field. Input and field are ' +
            'two separate seams applied in sequence: the field renders the chrome and receives the ' +
            'input as its children. Customise the input and the field still wraps it. Customise the ' +
            'field and the input still renders inside whatever you return. Most confusion about ' +
            'Sanity form customisation is one of these two being mistaken for the other.',
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

export const Default: Story = {
  name: '1. Default - what the field layer contributes',
  decorators: [WithStudioProviders({config: baseConfig})],
  parameters: {
    docs: {
      description: {
        story:
          'No customisation. Everything visible here that is not a text box is the field layer: the three titles, the two descriptions, the validation message under Summary, the change-indicator gutter down the left, and the collapse chevron on Credits.\n\nThat is a lot of surface for something with no visual identity of its own, which is exactly why it is easy to replace by accident.',
      },
    },
  },
  render: () => <FormBuilderHarness documentType="article" initialDocument={DOC} height={520} />,
}

export const Wrapped: Story = {
  name: '2. Wrapped - decorating with renderDefault',
  decorators: [
    WithStudioProviders({
      config: {...baseConfig, form: {components: {field: AnnotatedField}}} as never,
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'A field component that prints `level`, `name` and `changed` above `renderDefault(props)`. Everything from story 1 survives underneath.\n\nNote what `level` reveals. The Credits object is a field at level 0, and Author and Editor inside it are fields at level 1, so the badge appears three times for one object. **Field components recurse**, and a studio-wide field registration nests inside itself at every level of the schema. If your chrome has padding or a border, that padding compounds with depth, which is the usual reason a decorated field looks fine on a flat document and wrong on a nested one.\n\n`changed` is the same flag the change-indicator gutter reads, exposed as a plain boolean so a custom field can react to it directly.',
      },
    },
  },
  render: () => <FormBuilderHarness documentType="article" initialDocument={DOC} height={620} />,
}

export const Replaced: Story = {
  name: '3. Replaced - what the field layer was doing',
  decorators: [
    WithStudioProviders({
      config: {...baseConfig, form: {components: {field: BareField}}} as never,
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'A field that renders `props.children` and a title. Compare against story 1.\n\n**Gone:** the descriptions on Summary and Credits, which were content the schema author wrote and which no longer reach the editor at all. The validation message under Summary, still failing its `max(60)` rule silently. The change indicators. Presence avatars, which would show collaborators on a field in a live studio. And **the collapse chevron on Credits**, so an object the schema explicitly marked `collapsible` can no longer be collapsed.\n\nThat last one is the argument for reading this page before replacing anything. The other losses are visible in the render; the collapse one is a capability that simply stopped existing, and nothing in the form reports it.\n\nA replaced field is occasionally right, for a genuinely different chrome such as a side-by-side comparison layout. `props.title`, `props.description`, `props.validation` and `props.presence` are all handed over precisely so a replacement can render them itself, and a replacement that ignores them is a replacement that drops them.',
      },
    },
  },
  render: () => <FormBuilderHarness documentType="article" initialDocument={DOC} height={520} />,
}
