import {HighlightIcon} from '@sanity/icons/Highlight'
import {LinkIcon} from '@sanity/icons/Link'
import {type PortableTextBlock} from '@sanity/types'
import {Badge, Box, Flex, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {
  type BlockAnnotationProps,
  type BlockDecoratorProps,
  type BlockListItemProps,
  type BlockStyleProps,
} from '../../../../packages/sanity/src/core/form/types/blockProps'
import {FormBuilderHarness} from '../../lib/formBuilderHarness'
import {WithStudioProviders} from '../../lib/testProvider'

// --- the four renderers -------------------------------------------------------------------

/**
 * An ANNOTATION renderer, written the way the `BlockAnnotationProps` docblock recommends:
 * `renderDefault` is called with a MODIFIED prop rather than having its output wrapped.
 *
 * That idiom exists because an annotation is not a container around the text. It is a mark on
 * a span, and the span has to stay one contiguous editable run or the selection model breaks.
 * Wrapping `renderDefault(props)` in an element would insert a boundary inside the text; passing
 * a decorated `textElement` back in lets the default place it.
 */
function AuditedLink(props: BlockAnnotationProps) {
  return props.renderDefault({
    ...props,
    textElement: (
      <span style={{textDecorationStyle: 'wavy', textDecorationLine: 'underline'}}>
        {props.textElement}
      </span>
    ),
  })
}

/**
 * A DECORATOR renderer. Decorators are the simplest seam in Portable Text: no value, no form,
 * no dialog. `props.children` is the span as rendered without the decoration, and the job is
 * to put something around it.
 */
function Highlight(props: BlockDecoratorProps) {
  return <span style={{backgroundColor: 'rgba(255, 214, 0, 0.35)'}}>{props.children}</span>
}

/**
 * A STYLE renderer. `props.block` is the whole text block, `props.children` is it rendered
 * without the style, so this is a block-level wrapper rather than a span-level one.
 */
function LeadStyle(props: BlockStyleProps) {
  return (
    <Text size={3} weight="semibold" muted>
      {props.children}
    </Text>
  )
}

/**
 * A LIST renderer. `props.level` is the nesting depth, which is the reason this seam exists
 * separately from the style seam: a list marker has to know how deep it sits.
 */
function ChecklistItem(props: BlockListItemProps) {
  return (
    <Flex align="flex-start" gap={2} paddingLeft={props.level * 3}>
      <Box contentEditable={false} style={{userSelect: 'none', paddingTop: 2}}>
        <Text size={1}>&#9744;</Text>
      </Box>
      <Box flex={1}>{props.children}</Box>
    </Flex>
  )
}

// --- schema ---------------------------------------------------------------------------------

const internalLink = {
  name: 'internalLink',
  title: 'Internal link',
  type: 'object',
  icon: LinkIcon,
  fields: [{name: 'slug', title: 'Slug', type: 'string'}],
}

/**
 * `blockDef` is a function of the four component slots so the stories can turn them on one at a
 * time against an identical document. Everything else about the schema is fixed.
 */
const blockDef = (
  on: Partial<{annotation: boolean; decorator: boolean; style: boolean; list: boolean}> = {},
) => ({
  type: 'block',
  styles: [
    {title: 'Normal', value: 'normal'},
    {title: 'Lead', value: 'lead', ...(on.style ? {component: LeadStyle} : {})},
  ],
  lists: [
    {title: 'Bullet', value: 'bullet'},
    {title: 'Checklist', value: 'checklist', ...(on.list ? {component: ChecklistItem} : {})},
  ],
  marks: {
    decorators: [
      {title: 'Strong', value: 'strong'},
      {title: 'Emphasis', value: 'em'},
      {
        title: 'Highlight',
        value: 'highlight',
        icon: HighlightIcon,
        ...(on.decorator ? {component: Highlight} : {}),
      },
    ],
    annotations: [
      on.annotation ? {...internalLink, components: {annotation: AuditedLink}} : internalLink,
    ],
  },
})

const configWith = (
  on: Partial<{annotation: boolean; decorator: boolean; style: boolean; list: boolean}> = {},
) => ({
  name: 'default',
  title: 'Acme Content',
  schema: {
    name: 'default',
    types: [
      {
        name: 'article',
        title: 'Article',
        type: 'document',
        fields: [
          {name: 'title', title: 'Title', type: 'string'},
          {name: 'body', title: 'Body', type: 'array', of: [blockDef(on)]},
        ],
      },
    ],
  },
})

// --- the document ----------------------------------------------------------------------------

let n = 0
const k = () => `k${(n += 1)}`

const span = (text: string, marks: string[] = []) => ({
  _type: 'span',
  _key: k(),
  text,
  marks,
})

const BODY = [
  {
    _type: 'block',
    _key: k(),
    style: 'lead',
    markDefs: [],
    children: [span('A lead paragraph, carrying a custom block style.')],
  },
  {
    _type: 'block',
    _key: k(),
    style: 'normal',
    markDefs: [{_key: 'ann1', _type: 'internalLink', slug: '/pricing'}],
    children: [
      span('Ordinary prose with a '),
      span('custom highlight', ['highlight']),
      span(' and an '),
      span('internal link', ['ann1']),
      span(' in it.'),
    ],
  },
  {
    _type: 'block',
    _key: k(),
    style: 'normal',
    listItem: 'checklist',
    level: 1,
    markDefs: [],
    children: [span('A checklist item at level one')],
  },
  {
    _type: 'block',
    _key: k(),
    style: 'normal',
    listItem: 'checklist',
    level: 2,
    markDefs: [],
    children: [span('And one nested beneath it')],
  },
] as unknown as PortableTextBlock[]

const DOC = {
  _id: 'article-marks',
  _type: 'article',
  title: 'Marks, styles and lists',
  body: BODY,
}

const meta: Meta = {
  title: 'Customisation/Portable Text Marks',
  parameters: {
    docs: {
      description: {
        component: [
          'Annotations, decorators, styles, and list items customise the text of a Portable ' +
            'Text field rather than the objects embedded in it, and all four are schema-level ' +
            'only: none has a workspace-config equivalent, because there is nothing studio-wide ' +
            'to say about a decorator that only exists because a particular field declared it.',
          '',
          '|          |                                                                                                                                                                                                                    |',
          '| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |',
          '| Seams    | `marks.decorators[].component` (`BlockDecoratorProps`) · `styles[].component` (`BlockStyleProps`) · `lists[].component` (`BlockListItemProps`) · `<annotationType>.components.annotation` (`BlockAnnotationProps`) |',
          '| Tier     | SERVICE                                                                                                                                                                                                            |',
          '| Patterns | `rich-text-editing`                                                                                                                                                                                                |',
          '',
          '```ts',
          "{type: 'block',",
          " styles:  [{title: 'Lead',      value: 'lead',      component: LeadStyle}],",
          " lists:   [{title: 'Checklist', value: 'checklist', component: ChecklistItem}],",
          ' marks: {',
          "   decorators:  [{title: 'Highlight', value: 'highlight', component: Highlight}],",
          "annotations: [{name: 'internalLink', type: 'object', components: {annotation: " +
            'Ann}}],',
          ' }}',
          '```',
          '',
          'Note the inconsistency in that block, because it is real and it will cost you five ' +
            'minutes. Styles, lists and decorators take a singular `component`. Annotations take ' +
            'a `components` object with an `annotation` key. The reason is that an annotation is ' +
            'a full object type with fields, so it carries the same `components` bag every object ' +
            'type does; the other three are plain title/value pairs with no form behind them.',
          '',
          'Anything rendered inside the editor that is not part of the edited text must carry ' +
            '`contentEditable={false}`, and generally `userSelect: none` as well. The checklist ' +
            'below does this on its box glyph. Skip it and the editor counts your decoration as ' +
            'prose, which corrupts the selection and, on paste, the content.',
          '',
          'Each story turns on exactly one of the four against an identical document, so the ' +
            'diff is always attributable.',
          '',
          '> **Why it matters:** for a block object you decorate by wrapping the default ' +
            'render. For an annotation you generally cannot, because an annotation is a mark on a ' +
            'span rather than a container around one, and inserting an element around the default ' +
            'would put a boundary inside a run of editable text. The move instead is to call the ' +
            'default renderer with a modified prop, passing back a decorated text element rather ' +
            'than wrapping the whole thing. Same principle, inverted mechanics.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:customisation',
    'chapter:forms',
    'pattern:rich-text-editing',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

const render = () => (
  <FormBuilderHarness documentType="article" initialDocument={DOC} height={420} />
)

export const Default: Story = {
  name: '1. Default - four custom kinds, no renderers',
  decorators: [WithStudioProviders({config: configWith() as never})],
  parameters: {
    docs: {
      description: {
        story: [
          'The schema already declares a `lead` style, a `checklist` list, a `highlight` ' +
            'decorator and an `internalLink` annotation, and **none of them has a component**. ' +
            'Read what the editor does with that.',
          '',
          'All four are fully functional: they appear in the toolbar, they apply, they ' +
            'persist to the document, and they round-trip. What they lack is a _rendering_. The ' +
            'lead paragraph looks like a normal one, the highlight is invisible, and the ' +
            'checklist renders with the bullet default.',
          '',
          'That is the honest starting point for this page. A custom mark without a component ' +
            'is unstyled, not broken; the seam exists to answer the presentation question only. ' +
            'Note that the annotation is the exception: it gets a default rendering, because ' +
            'unlike the other three it has fields and therefore needs an affordance to open ' +
            'them.',
        ].join('\n'),
      },
    },
  },
  render,
}

export const Decorator: Story = {
  name: '2. Decorator',
  decorators: [WithStudioProviders({config: configWith({decorator: true}) as never})],
  parameters: {
    docs: {
      description: {
        story:
          'The `highlight` decorator with a component. `BlockDecoratorProps` is the smallest contract on this page: `children`, `value`, `title`, `focused`, `selected`, `schemaType`, `renderDefault`. No value of its own, no form, no dialog, because a decorator is a boolean on a span.\n\nThe component here does not call `renderDefault`, and for a decorator that is usually right rather than a shortcut. There is no default rendering for a decorator the studio did not define, so `renderDefault` has nothing to delegate to. The advice to decorate rather than replace is about seams with a substrate underneath, and this one has none.',
      },
    },
  },
  render,
}

export const Style: Story = {
  name: '3. Style',
  decorators: [WithStudioProviders({config: configWith({style: true}) as never})],
  parameters: {
    docs: {
      description: {
        story: [
          'The `lead` style with a component. The first paragraph now renders larger and ' +
            'semibold.',
          '',
          '`BlockStyleProps` gives you `block` (the whole text block, so the renderer can ' +
            'read its children or its `_key`) alongside `children` (the block rendered without ' +
            'this style). The seam is block-level: whatever you return replaces the paragraph ' +
            'container. The guidance in `definitionExtensions.ts` is to reach for `@sanity/ui` ' +
            'primitives rather than hard-coded CSS. A heading styled with a literal `font-size: ' +
            '24px` stops tracking the studio theme the moment anyone changes it, and Portable ' +
            'Text fields render inside panes of several different widths.',
        ].join('\n'),
      },
    },
  },
  render,
}

export const ListItem: Story = {
  name: '4. List item',
  decorators: [WithStudioProviders({config: configWith({list: true}) as never})],
  parameters: {
    docs: {
      description: {
        story: [
          'The `checklist` list with a component. Two items, nested one level apart.',
          '',
          '`BlockListItemProps` is the style contract plus **`level`**, and that single extra ' +
            'prop is why the seam is separate. A list marker has to know its depth, both to ' +
            'indent and, for ordered lists, to pick the right numbering scheme. The renderer ' +
            'here multiplies `level` into padding.',
          '',
          'This is also the story where the `contentEditable={false}` rule is doing visible ' +
            'work. The box glyph is not text the author typed, and without the attribute the ' +
            'editor would let the caret land inside it.',
        ].join('\n'),
      },
    },
  },
  render,
}

export const Annotation: Story = {
  name: '5. Annotation',
  decorators: [WithStudioProviders({config: configWith({annotation: true}) as never})],
  parameters: {
    docs: {
      description: {
        story:
          "The `internalLink` annotation with a component, written as `renderDefault({...props, textElement: …})` so the annotated run gets a wavy underline while the default keeps ownership of the span.\n\nClick the annotated text and the default opens the annotation's fields, because that affordance came from `renderDefault` rather than from this component. `BlockAnnotationProps` also hands over `open`, `onOpen`, `onClose`, `onRemove` and `children` (the annotation's own input form) so a component can present that editing surface itself, in a popover or inline, as the docblock's second example does.\n\nAnnotation is the seam where wrapping `renderDefault(props)` is the wrong reflex; the props-modification form is the right one. The `textElement` prop exists precisely so you have somewhere to put the decoration that is not around the whole default.",
      },
    },
  },
  render,
}

export const AllFour: Story = {
  name: '6. All four at once',
  decorators: [
    WithStudioProviders({
      config: configWith({annotation: true, decorator: true, style: true, list: true}) as never,
    }),
  ],
  parameters: {
    docs: {
      description: {
        story: [
          'Every seam on, which is what a real editorial schema looks like once someone has ' +
            'spent a week on it.',
          '',
          'Read this against story 1: the document is byte-for-byte identical in both. ' +
            'Portable Text stores marks, styles and list types as **plain strings** on the ' +
            'block, so none of these components changed what was saved. A schema that drops all ' +
            'four renderers still opens the same content, and a front end rendering it makes ' +
            'its own decisions independently.',
          '',
          'That separation is the reason these seams are presentation-only by design rather ' +
            'than by convention, and it is what makes them safe to change later.',
        ].join('\n'),
      },
    },
  },
  render: () => <FormBuilderHarness documentType="article" initialDocument={DOC} height={460} />,
}
