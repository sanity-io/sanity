import {Badge, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {type ObjectItemProps} from '../../../../packages/sanity/src/core/form/types/itemProps'
import {FormBuilderHarness} from '../../lib/formBuilderHarness'
import {WithStudioProviders} from '../../lib/testProvider'

/**
 * `speaker.role` is `required()` so one row in the fixture fails validation, giving the
 * Replaced story something concrete to lose. `tags` is an array of primitives alongside the
 * array of objects, because the item seam behaves differently across the two and the page
 * says so.
 */
const schemaTypes = [
  {
    name: 'speaker',
    title: 'Speaker',
    type: 'object',
    fields: [
      {name: 'name', title: 'Name', type: 'string'},
      {
        name: 'role',
        title: 'Role',
        type: 'string',
        validation: (rule: {required: () => unknown}) => rule.required(),
      },
    ],
    preview: {select: {title: 'name', subtitle: 'role'}},
  },
  {
    name: 'conference',
    title: 'Conference',
    type: 'document',
    fields: [
      {name: 'title', title: 'Title', type: 'string'},
      {name: 'speakers', title: 'Speakers', type: 'array', of: [{type: 'speaker'}]},
      {name: 'tags', title: 'Tags', type: 'array', of: [{type: 'string'}]},
    ],
  },
]

const baseConfig = {
  name: 'default',
  title: 'Acme Content',
  schema: {name: 'default', types: schemaTypes},
}

/** DECORATION. Prints the row index, then delegates. */
function NumberedItem(props: ObjectItemProps) {
  return (
    <Flex align="flex-start" gap={2}>
      <Card padding={2} radius={2} tone="primary" style={{minWidth: 32, textAlign: 'center'}}>
        <Text size={0} weight="semibold">
          {props.index + 1}
        </Text>
      </Card>
      <Card flex={1}>{props.renderDefault(props)}</Card>
    </Flex>
  )
}

/**
 * REPLACEMENT. Draws the row from `props.value` and never calls `renderDefault`, so the row
 * chrome (drag handle, menu, validation, the click target that opens the row) is gone.
 */
function BareItem(props: ObjectItemProps) {
  const value = props.value as {name?: string; role?: string}
  return (
    <Card border radius={2} padding={3} tone="critical" marginBottom={2}>
      <Stack gap={2}>
        <Flex align="center" gap={2}>
          <Badge tone="critical" fontSize={0}>
            replaced
          </Badge>
          <Text size={1} weight="medium">
            {value.name ?? 'Unnamed'}
          </Text>
        </Flex>
        <Text size={1} muted>
          {value.role ?? 'no role'}
        </Text>
      </Stack>
    </Card>
  )
}

const DOC = {
  _id: 'conf-2026',
  _type: 'conference',
  title: 'Structured Content 2026',
  speakers: [
    {_key: 's1', _type: 'speaker', name: 'Ada Okonkwo', role: 'Principal Engineer'},
    {_key: 's2', _type: 'speaker', name: 'Bo Lindqvist', role: 'Head of Content'},
    {_key: 's3', _type: 'speaker', name: 'Mira Haddad'},
  ],
  tags: ['structured-content', 'cms', 'portable-text'],
}

const meta: Meta = {
  title: 'Customisation/Custom Item',
  parameters: {
    docs: {
      description: {
        component: [
          'A row is its own thing, separate from both the array input and the fields inside it: ' +
            'its drag handle, its preview, its menu, and the affordance that opens it for ' +
            'editing.',
          '',
          '| | |',
          '|---|---|',
          '| Seam | `form.components.item`, typed `ComponentType<ItemProps>` and narrowing to `ObjectItemProps` for arrays of objects |',
          '| Tier | SERVICE |',
          '| Patterns | `array-editing` |',
          '',
          'Where it sits in the stack: an array field renders an array input, which renders one ' +
            "item per member, and each item renders the object's own fields inside it. So a " +
            "single array row passes through field (the array's own chrome), then input (the " +
            'array input), then item (the row), then field and input again for every field inside ' +
            'the row. Four of the seven form seams fire on one row of one array. Check that ' +
            'before registering anything studio-wide.',
          '',
          '`ObjectItemProps` carries `collapsed`/`collapsible` and `open`/`onOpen`/`onClose`, ' +
            "and they are not the same mechanism. Collapsing shows or hides the row's fields in " +
            'place. Opening puts them in a dialog. Which one an array uses depends on its ' +
            '`options`, and a replacement that wires only one of them will feel broken in arrays ' +
            'configured for the other.',
          '',
          'Arrays of primitives do not come here. `tags` in the document below is `array of ' +
            'string`, and its rows go through `ItemProps` rather than `ObjectItemProps`: no ' +
            '`open`, no `collapsed`, no preview, because there is no object to preview. Story 2 ' +
            'shows both arrays under one registration so the difference is visible rather than ' +
            'described.',
          '',
          '> **Why it matters:** a row is not the same thing as its contents. Two mechanisms ' +
            'live on this seam that look interchangeable and are not, collapsing a row in place ' +
            'and opening it in a dialog, and a replacement that wires only one will feel broken ' +
            'in arrays configured for the other.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:customisation',
    'chapter:forms',
    'pattern:array-editing',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

export const Default: Story = {
  name: '1. Default - what a row gives you',
  decorators: [WithStudioProviders({config: baseConfig})],
  parameters: {
    docs: {
      description: {
        story:
          "No customisation. Each speaker row carries a drag handle, a preview drawn from the type's `preview.select`, and a menu. The third row is missing its required `role` and says so with a marker on the row itself rather than only inside it, which matters because the field it belongs to is not visible until the row is opened.\n\nThat is the row's real job: **surfacing what is wrong inside something that is closed.** Click a row to open it and the fields appear; the tags array below behaves differently, editing in place.",
      },
    },
  },
  render: () => <FormBuilderHarness documentType="conference" initialDocument={DOC} height={520} />,
}

export const Wrapped: Story = {
  name: '2. Wrapped - decorating with renderDefault',
  decorators: [
    WithStudioProviders({
      config: {...baseConfig, form: {components: {item: NumberedItem}}} as never,
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'A row number to the left of `renderDefault(props)`, taken from `props.index`. The drag handle, the preview, the menu and the validation marker on row three all survive.\n\n**Look at the tags array underneath.** The same component is numbering those rows too, because `form.components.item` is studio-wide and applies to every array of every kind. It happens to work here, but the component is typed `ObjectItemProps` and a primitive row does not carry `changed`, `open`, or `collapsed`. A studio-wide item component that reads any of those against a primitive array reads `undefined`.\n\nThe fix is the same as everywhere else in this chapter: register on the type, or branch and delegate.\n\nOrdinal numbering is also a genuinely reasonable thing to want here, since an array is ordered and the default does not say so anywhere.',
      },
    },
  },
  render: () => <FormBuilderHarness documentType="conference" initialDocument={DOC} height={560} />,
}

export const Replaced: Story = {
  name: '3. Replaced - what a row was doing',
  decorators: [
    WithStudioProviders({
      config: {...baseConfig, form: {components: {item: BareItem}}} as never,
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Rows drawn from `props.value`, no `renderDefault`. Compare against story 1.\n\n**Gone:** the drag handle, so an ordered array can no longer be ordered. The row menu, so rows cannot be removed or duplicated. The validation marker on row three, whose missing `role` is now invisible at every level the author can see. And the click target that opens the row, so **the fields inside these rows can no longer be reached at all**.\n\nThat last point is the one to sit with. Unlike a replaced input, which at minimum still renders something the author can type into, a replaced item can silently make its own contents unreachable. `props.onOpen` and `props.open` are handed over so a replacement can present that itself, and a replacement that forgets them produces an array of read-only cards that look deliberate.\n\nNote the tags array below is unaffected in the ways that matter, because primitive rows have less to lose.',
      },
    },
  },
  render: () => <FormBuilderHarness documentType="conference" initialDocument={DOC} height={520} />,
}
