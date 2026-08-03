import {Badge, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {type PreviewProps} from '../../../../packages/sanity/src/core/components/previews/types'
import {FormBuilderHarness} from '../../lib/formBuilderHarness'
import {WithStudioProviders} from '../../lib/testProvider'

const schemaTypes = [
  {
    name: 'speaker',
    title: 'Speaker',
    type: 'object',
    fields: [
      {name: 'name', title: 'Name', type: 'string'},
      {name: 'role', title: 'Role', type: 'string'},
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
    ],
  },
]

const baseConfig = {
  name: 'default',
  title: 'Acme Content',
  schema: {name: 'default', types: schemaTypes},
}

/**
 * DECORATION. Adds a layout badge and delegates.
 *
 * `props.layout` is the reason this seam is harder than it looks: one component is asked to
 * render in every shape the studio needs a preview in, and the badge here makes which one
 * visible rather than leaving it to be guessed.
 */
function LabelledPreview(props: PreviewProps) {
  return (
    <Flex align="center" gap={2}>
      <Badge tone="primary" fontSize={0}>
        {props.layout ?? 'default'}
      </Badge>
      <Card flex={1}>{props.renderDefault(props)}</Card>
    </Flex>
  )
}

/**
 * REPLACEMENT that handles `isPlaceholder`. Included so the page can show the difference
 * between a replacement that thought about loading and one that did not.
 */
function CarefulPreview(props: PreviewProps) {
  if (props.isPlaceholder) {
    return (
      <Text size={1} muted>
        Loading…
      </Text>
    )
  }
  return (
    <Stack gap={2}>
      <Text size={1} weight="medium">
        {typeof props.title === 'function' ? '' : props.title}
      </Text>
      <Text size={0} muted>
        {typeof props.subtitle === 'function' ? '' : props.subtitle}
      </Text>
    </Stack>
  )
}

/**
 * REPLACEMENT that does not. Reads `title` directly, which is the shape most people write
 * first and which mishandles both of this seam's traps: the placeholder state, and the fact
 * that `title` may be a COMPONENT rather than a node.
 */
function NaivePreview(props: PreviewProps) {
  return (
    <Card border radius={2} padding={2} tone="critical">
      <Text size={1}>{props.title as never}</Text>
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
    {_key: 's3', _type: 'speaker', name: 'Mira Haddad', role: 'Staff Designer'},
  ],
}

const meta: Meta = {
  title: 'Customisation/Custom Preview',
  parameters: {
    docs: {
      description: {
        component: [
          'A preview receives none of the form node other seams get, no value, no path, no ' +
            'schema type, no change handlers, only `title`, `subtitle`, `media`, `status`, ' +
            '`description` and a `layout`, already resolved. That makes it the odd one out among ' +
            'the seven form seams. Know why before writing one.',
          '',
          '| | |',
          '|---|---|',
          '| Seam | `form.components.preview`, typed `ComponentType<PreviewProps>` |',
          '| Tier | SERVICE |',
          '',
          'This is how a document or object is summarised anywhere it appears as a reference to ' +
            'itself rather than as a form: array rows, reference fields, search results, document ' +
            'lists, the pane list. It is a presentation component with no access to the document ' +
            'behind it, deliberately, because the same preview has to render in places where the ' +
            'document is not loaded.',
          '',
          'Two traps, both invisible in a story that renders one happy state. First, `title` ' +
            'may be a component, not a node: the type is `ReactNode | ComponentType<{layout}>`, ' +
            'and the same is true of `subtitle`, `media`, `status` and `description`. A caller ' +
            'that needs the value to depend on the layout passes a component and lets the preview ' +
            'call it. A replacement written as `<Text>{props.title}</Text>` renders nothing at ' +
            'all when it is handed one, and React will not warn.',
          '',
          'Second, `isPlaceholder` is the loading state. Previews resolve asynchronously ' +
            'against the Content Lake, so a preview renders before its values arrive. The default ' +
            'renders skeletons. A replacement that ignores the flag renders `undefined` for a ' +
            'beat, or permanently if the document is missing.',
          '',
          'Layout is a requirement, not a hint. One component is called for `default`, `media`, ' +
            '`detail`, `compact`, and for the Portable Text shapes `block`, `blockImage` and ' +
            '`inline`. A custom preview sized for a document list will be wrong inside a text ' +
            'paragraph. `renderDefault` handles all seven; a replacement handles the ones its ' +
            'author thought of.',
          '',
          'The previews visible below are array-row previews, which is `layout="default"`. The ' +
            'other layouts are exercised in Lists & Data/Previews, which stories the default ' +
            'preview components directly at every layout key.',
          '',
          '> **Why it matters:** the two traps above are both conditional, and both invisible ' +
            'in a story that renders one happy state against a small, complete, already-loaded ' +
            'document. A replacement that skips them looks correct in exactly the conditions it ' +
            'was developed under.',
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

const render = () => (
  <FormBuilderHarness documentType="conference" initialDocument={DOC} height={440} />
)

export const Default: Story = {
  name: '1. Default - the resolved preview',
  decorators: [WithStudioProviders({config: baseConfig})],
  parameters: {
    docs: {
      description: {
        story: [
          'No customisation. Each row shows the title and subtitle the `speaker` type ' +
            'selected, laid out by the default preview for this layout.',
          '',
          'The schema said very little: `preview: {select: {title: "name", subtitle: ' +
            '"role"}}`. Everything about the arrangement, the truncation behaviour, the ' +
            'placeholder handling and the media slot came from the default component rather ' +
            'than the declaration.',
        ].join('\n'),
      },
    },
  },
  render,
}

export const Wrapped: Story = {
  name: '2. Wrapped - reading the layout',
  decorators: [
    WithStudioProviders({
      config: {...baseConfig, form: {components: {preview: LabelledPreview}}} as never,
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'The same previews with `props.layout` printed beside each. The badge reads `default`, which is what an array row asks for.\n\nThe badge proves that **the layout arrives as a prop rather than being implied by where the component was registered.** One registration, many shapes. If you open `Lists & Data/Previews` you can see the same set of values rendered at `media`, `detail` and `compact`, and a custom preview registered studio-wide is responsible for all of them.\n\nThe decoration itself is trivially safe because `renderDefault` is still doing the work.',
      },
    },
  },
  render,
}

export const ReplacedCarefully: Story = {
  name: '3. Replaced, carefully',
  decorators: [
    WithStudioProviders({
      config: {...baseConfig, form: {components: {preview: CarefulPreview}}} as never,
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'A replacement that checks `isPlaceholder` before rendering and guards against `title` arriving as a function. Both guards are three lines and both are the difference between a preview that degrades and one that shows `undefined` to an editor.\n\nWhat it still gives up, and cannot easily get back: the media slot, the status slot, layout-appropriate sizing across all seven layout keys, and the truncation the default applies so a long title does not break the row it sits in. Those are the parts of a preview that look like nothing until content is real.\n\nCompare against story 1 and the loss is modest here, because this document is small, complete and loaded. That is the shape of the risk with this particular seam: the replacement looks correct in exactly the conditions you develop it under.',
      },
    },
  },
  render,
}

export const ReplacedNaively: Story = {
  name: '4. Replaced, naively',
  decorators: [
    WithStudioProviders({
      config: {...baseConfig, form: {components: {preview: NaivePreview}}} as never,
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          '`<Text>{props.title}</Text>` and nothing else, which is the first thing most people write.\n\nAgainst this fixture it looks fine, and that is the story. The two failures it carries are both conditional: it renders nothing when a caller passes `title` as a component, and it renders nothing during the placeholder beat before values resolve. Neither reproduces against a small local document that is already loaded.\n\nStoried deliberately as a **negative example**, so the chapter has a rendering of the shape that passes review and fails in production rather than only a description of it. Read it against story 3, where the same replacement is two guards better.',
      },
    },
  },
  render,
}
