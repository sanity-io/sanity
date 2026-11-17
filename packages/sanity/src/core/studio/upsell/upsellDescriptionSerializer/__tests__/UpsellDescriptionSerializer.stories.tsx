import {
  type PortableTextBlock,
  type PortableTextChild,
  type PortableTextObject,
  type PortableTextSpan,
  type PortableTextTextBlock,
} from '@sanity/types'
import {Card} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {UpsellDescriptionSerializer} from '../UpsellDescriptionSerializer'

function span(key: string, text: string, marks: string[] = []): PortableTextSpan {
  return {_type: 'span', _key: key, text, marks}
}

function block(
  key: string,
  children: PortableTextChild[],
  options: {style?: string; listItem?: string; markDefs?: PortableTextObject[]} = {},
): PortableTextTextBlock {
  return {
    _type: 'block',
    _key: key,
    style: options.style ?? 'normal',
    markDefs: options.markDefs ?? [],
    children,
    ...(options.listItem ? {listItem: options.listItem, level: 1} : {}),
  }
}

/**
 * The same block shapes the `/journey/*` upsell endpoints return: headings,
 * normal paragraphs with strong / semibold / accent marks and a link, bullet
 * and numbered list items, a divider, inline icons next to text, and
 * `iconAndText` rows with and without the accent tone. Icons are
 * `sanityIcon` symbols only, so nothing is fetched.
 */
const BLOCKS: PortableTextBlock[] = [
  block('h2', [span('h2-1', 'Upgrade to {{planName}}')], {style: 'h2'}),
  block(
    'intro',
    [
      span('intro-1', 'Scheduling is available on the '),
      span('intro-2', 'Growth plan', ['strong']),
      span('intro-3', ' and above. '),
      span('intro-4', 'Compare plans', ['link-1']),
      span('intro-5', ' to see what else is included.'),
    ],
    {
      markDefs: [
        {_type: 'link', _key: 'link-1', href: 'https://www.sanity.io/pricing', showIcon: true},
      ],
    },
  ),
  block('h3', [span('h3-1', 'What you get')], {style: 'h3'}),
  block('bullet-1', [span('bullet-1-1', 'Schedule publishing for up to {{limit}} documents')], {
    listItem: 'bullet',
  }),
  block(
    'bullet-2',
    [
      span('bullet-2-1', 'Content releases with '),
      span('bullet-2-2', 'per-release', ['semibold']),
      span('bullet-2-3', ' access control'),
    ],
    {listItem: 'bullet'},
  ),
  block('number-1', [span('number-1-1', 'Pick a plan')], {listItem: 'number'}),
  block('number-2', [span('number-2-1', 'Confirm the upgrade in Manage')], {listItem: 'number'}),
  {_type: 'divider', _key: 'divider-1'},
  block('inline', [
    span('inline-1', 'Look for the '),
    {_type: 'inlineIcon', _key: 'inline-icon-1', sanityIcon: 'calendar'},
    span('inline-2', ' icon in the document footer, or the '),
    {_type: 'inlineIcon', _key: 'inline-icon-2', sanityIcon: 'rocket', accent: true},
    span('inline-3', ' badge on '),
    span('inline-4', 'new features', ['accent']),
    span('inline-5', '.'),
  ]),
  {
    _type: 'iconAndText',
    _key: 'icon-text-1',
    sanityIcon: 'calendar',
    title: 'Scheduled publishing',
    text: 'Publish at a set date and time, without having to be at your desk.',
  },
  {
    _type: 'iconAndText',
    _key: 'icon-text-2',
    sanityIcon: 'rocket',
    accent: true,
    title: 'Available on {{planName}}',
    text: 'Accent rows highlight the feature the current plan is missing.',
  },
]

const INTERPOLATION = {planName: 'Growth', limit: 5}

/**
 * Chromatic sentinel for the upsell description serializer: the Portable Text
 * block, list, mark and custom-type components that every upsell panel and
 * dialog renders its copy through. Blocks are fixtures with `{{placeholders}}`
 * filled from `interpolation`; the link click handler is omitted.
 */
const meta = {
  title: 'Studio/Upsell Description Serializer',
  component: UpsellDescriptionSerializer,
  args: {
    blocks: BLOCKS,
    interpolation: INTERPOLATION,
  },
  render: (args) => (
    <Card padding={4} style={{maxWidth: 560}}>
      <UpsellDescriptionSerializer {...args} />
    </Card>
  ),
} satisfies Meta<typeof UpsellDescriptionSerializer>

export default meta
type Story = StoryObj<typeof meta>

export const Blocks: Story = {}
