import {CreditCardIcon} from '@sanity/icons/CreditCard'
import {TrendUpwardIcon} from '@sanity/icons/TrendUpward'
import {type PortableTextBlock} from '@sanity/types'
import {Badge, Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {type BlockProps} from '../../../../packages/sanity/src/core/form/types/blockProps'
import {FormBuilderHarness} from '../../lib/formBuilderHarness'
import {WithStudioProviders} from '../../lib/testProvider'

/**
 * Two user-created member types, one of each kind, because the seam that renders them is
 * named for the kind rather than the type:
 *
 * - `productCard` is a BLOCK object. It sits as a sibling of paragraphs in the array and is
 *   rendered by `components.block`.
 * - `stockTicker` is an INLINE object. It sits inside a text block's `.of` and is rendered by
 *   `components.inlineBlock`.
 *
 * `productCard.price` is `required()` so the harness's real `validateDocument` has something
 * to say about a block, which is what makes the cost of the Replaced story visible rather
 * than merely asserted.
 */
const stockTicker = {
  name: 'stockTicker',
  title: 'Stock ticker',
  type: 'object',
  icon: TrendUpwardIcon,
  fields: [{name: 'symbol', title: 'Symbol', type: 'string'}],
  preview: {select: {title: 'symbol'}},
}

const productCard = {
  name: 'productCard',
  title: 'Product card',
  type: 'object',
  icon: CreditCardIcon,
  fields: [
    {name: 'productName', title: 'Product', type: 'string'},
    {
      name: 'price',
      title: 'Price',
      type: 'string',
      validation: (rule: {required: () => unknown}) => rule.required(),
    },
  ],
  preview: {select: {title: 'productName', subtitle: 'price'}},
}

const article = {
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [
    {name: 'title', title: 'Title', type: 'string'},
    {
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [{type: 'block', of: [{type: 'stockTicker'}]}, {type: 'productCard'}],
    },
  ],
}

const baseTypes = [stockTicker, productCard, article]

const baseConfig = {
  name: 'default',
  title: 'Acme Content',
  schema: {name: 'default', types: baseTypes},
}

/**
 * `config` is spread over the base rather than replacing it, so every story below runs the
 * same schema and the same document and differs only in where a component was registered.
 */
const withTypes = (types: unknown[]) => ({
  ...baseConfig,
  schema: {name: 'default', types},
})

// --- the custom renderers ------------------------------------------------------------------

/**
 * DECORATION, scoped to one type. Calls `renderDefault(props)` and frames it.
 *
 * `props.value` is the block object itself, so the renderer can read the authored data and
 * still delegate the actual rendering. `props.open` and `props.onOpen` are the edit dialog,
 * which the default is what wires up.
 */
function FramedCard(props: BlockProps) {
  const value = props.value as {productName?: string; price?: string}
  return (
    <Card border radius={2} padding={2} tone="primary">
      <Stack gap={2}>
        <Flex align="center" gap={2}>
          <Badge tone="primary" fontSize={0}>
            productCard
          </Badge>
          <Text size={0} muted>
            {value.price ? `costed at ${value.price}` : 'no price yet'}
          </Text>
        </Flex>
        {props.renderDefault(props)}
      </Stack>
    </Card>
  )
}

/**
 * The same decoration registered studio-wide instead of per type. Identical body; the only
 * difference is where it is registered, and the story shows that difference is large.
 */
function FramedEveryBlock(props: BlockProps) {
  return (
    <Card border radius={2} padding={2} tone="caution">
      <Stack gap={2}>
        <Badge tone="caution" fontSize={0}>
          {props.schemaType.name}
        </Badge>
        {props.renderDefault(props)}
      </Stack>
    </Card>
  )
}

/**
 * REPLACEMENT. Never calls `renderDefault`, so the block renders as authored data and nothing
 * else: no edit dialog, no drag handle, no validation marker, no context menu.
 */
function BareCard(props: BlockProps) {
  const value = props.value as {productName?: string; price?: string}
  return (
    <Card border radius={2} padding={3} tone="critical">
      <Stack gap={2}>
        <Badge tone="critical" fontSize={0}>
          replaced
        </Badge>
        <Text size={1} weight="medium">
          {value.productName ?? 'Untitled product'}
        </Text>
        <Text size={1} muted>
          {value.price ?? 'no price'}
        </Text>
      </Stack>
    </Card>
  )
}

/**
 * An inline object renderer. Inline blocks sit in the text flow, so the container must not
 * introduce block layout or the line breaks around it.
 */
function TickerPill(props: BlockProps) {
  const value = props.value as {symbol?: string}
  return (
    <Box
      as="span"
      style={{display: 'inline-flex', verticalAlign: 'baseline'}}
      onClick={props.onOpen}
    >
      <Badge tone="positive" fontSize={0}>
        {value.symbol ? `$${value.symbol}` : 'ticker'}
      </Badge>
    </Box>
  )
}

// --- the document --------------------------------------------------------------------------

const key = (n: number) => `k${n}`

const BODY: PortableTextBlock[] = [
  {
    _type: 'block',
    _key: key(1),
    style: 'normal',
    markDefs: [],
    children: [
      {_type: 'span', _key: key(2), text: 'The quarter closed strong, led by ', marks: []},
      {_type: 'stockTicker', _key: key(3), symbol: 'ACME'},
      {_type: 'span', _key: key(4), text: ' and a product line that finally landed.', marks: []},
    ],
  },
  {
    _type: 'productCard',
    _key: key(5),
    productName: 'Acme Desk Lamp',
    price: '$89',
  },
  {
    _type: 'block',
    _key: key(6),
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: key(7),
        text: 'A second paragraph, so the difference between a',
        marks: [],
      },
      {_type: 'span', _key: key(8), text: ' scoped ', marks: ['em']},
      {_type: 'span', _key: key(9), text: 'and a studio-wide registration is visible.', marks: []},
    ],
  },
  {
    _type: 'productCard',
    _key: key(10),
    productName: 'Acme Notebook',
  },
] as unknown as PortableTextBlock[]

const DOC = {
  _id: 'article-quarterly',
  _type: 'article',
  title: 'The quarter in review',
  body: BODY,
}

const meta: Meta = {
  title: 'Customisation/Portable Text Blocks',
  parameters: {
    docs: {
      description: {
        component: [
          'Portable Text ships a handful of default members, paragraphs, headings, lists, a ' +
            'link annotation, and everything past that is a type an author defines. The editor ' +
            'has to be told how to draw it through one seam every block in the array arrives at, ' +
            'rather than through a registry of renderers keyed by type name.',
          '',
          '| | |',
          '|---|---|',
          '| Seams | `components.block` and `components.inlineBlock`, both typed `ComponentType<BlockProps>`, available at two levels: the workspace config (`form.components.block`) and a schema type’s own `components.block` |',
          '| Tier | SERVICE |',
          '| Patterns | `rich-text-editing` |',
          '',
          'How a user-created Portable Text member gets rendered inside the editor: one schema, ' +
            'one document, four registrations below.',
          '',
          'The distinction that decides your code is which of the two levels you register at, ' +
            'and it is not a matter of taste. On the type (`productCard.components.block`) the ' +
            'renderer sees only that type; this is what you want almost always. On the config ' +
            '(`form.components.block`) the renderer sees every block in every Portable Text field ' +
            'in the studio, including plain paragraphs. `Compositor.tsx` passes the same ' +
            '`renderBlock` to `TextBlock` that it passes to block objects, so a studio-wide block ' +
            'component wraps the prose too. Story 3 shows this happening.',
          '',
          'That asymmetry catches people because the analogous input seam behaves the same way ' +
            'and is equally surprising there. The fix is the same in both places: register on the ' +
            'type, or branch on `props.schemaType.name` and return `props.renderDefault(props)` ' +
            'for everything you did not mean to touch.',
          '',
          'A block object has no default of its own to fall back on beyond its preview. ' +
            '`renderDefault` for a `productCard` draws the preview, the drag handle, the context ' +
            'menu and the open-for-edit affordance. That is a smaller default than a text block ' +
            'gets, but it is the entire interaction model for the block. Read story 5 before you ' +
            'replace one.',
          '',
          '> **Why it matters:** register on the type unless a treatment genuinely belongs on ' +
            'every block everywhere. A studio-wide registration on the config seam wraps the ' +
            'prose as well as the custom objects, and that surprise is the single most common way ' +
            'this seam goes wrong.',
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

const render =
  (height = 460) =>
  () => <FormBuilderHarness documentType="article" initialDocument={DOC} height={height} />

export const Default: Story = {
  name: '1. Default - what a custom block gets for free',
  decorators: [WithStudioProviders({config: baseConfig})],
  parameters: {
    docs: {
      description: {
        story:
          'No component registered anywhere. Both `productCard` blocks render through the default: the schema `preview` supplies the title and subtitle, and the block carries a drag handle, a context menu and a click target that opens its fields for editing.\n\nNote the second card. It has no `price`, which its schema marks `required()`, and the default surfaces that as a validation marker on the block itself rather than only at the field level. That marker is the thing most easily lost, so it is the thing to watch across the next three stories.\n\nThe `$ACME` pill in the first paragraph is the inline object, also rendering through its preview.',
      },
    },
  },
  render: render(),
}

export const ScopedToType: Story = {
  name: '2. Scoped - components.block on the type',
  decorators: [
    WithStudioProviders({
      config: withTypes([
        stockTicker,
        {...productCard, components: {block: FramedCard}},
        article,
      ]) as never,
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "The renderer is registered on `productCard` itself. Both cards are now framed and labelled with their price, and **the paragraphs are untouched**, because the seam was declared on the type rather than on the studio.\n\nThe frame reads `props.value` for the price and then calls `props.renderDefault(props)` for the body, which is the shape almost every real custom block wants: your chrome around Studio's substrate. The validation marker on the second card survives, as does the drag handle and the edit affordance, because the default is still the thing rendering them.\n\nThis is the registration to reach for by default.",
      },
    },
  },
  render: render(520),
}

export const StudioWide: Story = {
  name: '3. Studio-wide - the same component on the config',
  decorators: [
    WithStudioProviders({
      config: {...baseConfig, form: {components: {block: FramedEveryBlock}}} as never,
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'The identical decoration pattern, moved to `form.components.block`. Every block is now framed, **including the two paragraphs**, and the badge prints `props.schemaType.name` so you can read what actually arrived at the seam: `block`, `productCard`, `block`, `productCard`.\n\nThis is not a bug and it is not a special case. `Compositor.tsx` hands the same `renderBlock` callback to `TextBlock` as it hands to block objects, so a studio-wide registration is a registration over the prose as well. If you came here wanting to style one custom type and reached for the config seam because it was the one you found first, this is the result.\n\nThe legitimate use of this seam is a treatment that genuinely should apply to everything: a debug outline, a per-block comment affordance, a change indicator. For one type, use story 2.',
      },
    },
  },
  render: render(560),
}

export const InlineBlock: Story = {
  name: '4. Inline - components.inlineBlock',
  decorators: [
    WithStudioProviders({
      config: withTypes([
        {...stockTicker, components: {inlineBlock: TickerPill}},
        productCard,
        article,
      ]) as never,
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'The `$ACME` ticker rendered by its own `components.inlineBlock`, which takes the same `BlockProps` as a block object does. The seam is separate because the constraint is: an inline object sits inside the text flow, so its container has to be inline or it breaks the line it lives on.\n\n**The rule that is easy to miss:** anything you render inside a Portable Text editor that is not editable text must be marked `contentEditable={false}`, or the editor treats it as part of the prose and the selection model goes wrong. A plain badge like this one is small enough not to show the symptom; a custom block containing a form field is not, and the `BlockAnnotationProps` docblock in `blockProps.ts` says so explicitly.\n\nNote what this pill gave up by not calling `renderDefault`: it is clickable to open, because `props.onOpen` was wired manually, but there is no keyboard affordance and no context menu.',
      },
    },
  },
  render: render(),
}

export const Replaced: Story = {
  name: '5. Replaced - what skipping renderDefault costs a block',
  decorators: [
    WithStudioProviders({
      config: withTypes([
        stockTicker,
        {...productCard, components: {block: BareCard}},
        article,
      ]) as never,
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'A `productCard` renderer that draws the authored values itself and never calls `renderDefault`. Compare it against story 1 card for card.\n\n**Gone:** the validation marker on the second card, which is missing its required `price` and no longer says so anywhere in the editor. The drag handle, so the block cannot be reordered. The context menu, so it cannot be duplicated or deleted from the block itself. The click-to-open affordance, so **its fields can no longer be edited at all** unless the component wires `props.onOpen` and renders `props.open` itself.\n\nThat last one is the difference between this seam and the input seam. A replaced input still renders an editable control because the replacement author writes one. A replaced block object renders authored data, and the editing surface for that data lives behind `open` / `onOpen` / `onClose`, which are props rather than markup. Skip `renderDefault` here and you have to rebuild a dialog, not a text field.\n\nThere is a real case for it, which is a block whose whole point is a bespoke editing surface. It is a larger commitment than it looks from the outside.',
      },
    },
  },
  render: render(),
}
