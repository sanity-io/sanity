/**
 * Reproduction schema for nested array insert menu clipping inside the
 * enhanced object dialog (reported in 5.22.0).
 *
 * Structure:
 * - Top-level array of section objects
 * - Each section contains a `blocks` array with 24+ block types
 * - The blocks array uses the insert menu grid view (icons as previews)
 *
 * Manual repro:
 * 1. Structure → Inputs → Debug → Nested array insert menu repro.
 * 2. Add a section to the top-level array and open it (enhanced object dialog).
 * 3. In the section, click Add on the Blocks field.
 * 4. The insert menu should overflow the dialog; in 5.22.0 it is clipped inside.
 */
import {ActivityIcon} from '@sanity/icons/Activity'
import {BarChartIcon} from '@sanity/icons/BarChart'
import {BellIcon} from '@sanity/icons/Bell'
import {BlockContentIcon} from '@sanity/icons/BlockContent'
import {BlockElementIcon} from '@sanity/icons/BlockElement'
import {BookIcon} from '@sanity/icons/Book'
import {CalendarIcon} from '@sanity/icons/Calendar'
import {CaseIcon} from '@sanity/icons/Case'
import {ChartUpwardIcon} from '@sanity/icons/ChartUpward'
import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {CogIcon} from '@sanity/icons/Cog'
import {ComposeIcon} from '@sanity/icons/Compose'
import {DocumentIcon} from '@sanity/icons/Document'
import {EarthGlobeIcon} from '@sanity/icons/EarthGlobe'
import {EditIcon} from '@sanity/icons/Edit'
import {EnvelopeIcon} from '@sanity/icons/Envelope'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {FolderIcon} from '@sanity/icons/Folder'
import {HeartFilledIcon} from '@sanity/icons/HeartFilled'
import {HomeIcon} from '@sanity/icons/Home'
import {ImageIcon} from '@sanity/icons/Image'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {LinkIcon} from '@sanity/icons/Link'
import {MicrophoneIcon} from '@sanity/icons/Microphone'
import {PinFilledIcon} from '@sanity/icons/PinFilled'
import {PlayIcon} from '@sanity/icons/Play'
import {RocketIcon} from '@sanity/icons/Rocket'
import {SearchIcon} from '@sanity/icons/Search'
import {SparkleIcon} from '@sanity/icons/Sparkle'
import {StarIcon} from '@sanity/icons/Star'
import {TagIcon} from '@sanity/icons/Tag'
import {ThLargeIcon} from '@sanity/icons/ThLarge'
import {UserIcon} from '@sanity/icons/User'
import {VideoIcon} from '@sanity/icons/Video'
import {type ComponentType} from 'react'
import {defineArrayMember, defineField, defineType} from 'sanity'

const BLOCK_TYPE_COUNT = 24

const BLOCK_TYPE_ICONS: ComponentType[] = [
  BlockElementIcon,
  BlockContentIcon,
  ImageIcon,
  VideoIcon,
  DocumentIcon,
  ComposeIcon,
  BookIcon,
  CalendarIcon,
  CaseIcon,
  ChartUpwardIcon,
  CheckmarkCircleIcon,
  CogIcon,
  EarthGlobeIcon,
  EditIcon,
  EnvelopeIcon,
  FolderIcon,
  HeartFilledIcon,
  HomeIcon,
  LinkIcon,
  MicrophoneIcon,
  PlayIcon,
  RocketIcon,
  SearchIcon,
  SparkleIcon,
  StarIcon,
  TagIcon,
  ThLargeIcon,
  UserIcon,
  ActivityIcon,
  BarChartIcon,
  BellIcon,
  ErrorOutlineIcon,
  InfoOutlineIcon,
  PinFilledIcon,
]

const BLOCK_TYPE_LABELS = [
  'Hero',
  'Rich text',
  'Image',
  'Video',
  'Document',
  'Article',
  'Book list',
  'Event',
  'Gallery',
  'Case study',
  'Stats',
  'Call to action',
  'Settings',
  'Map',
  'Editorial',
  'Newsletter',
  'Folder',
  'Testimonial',
  'Homepage',
  'Link list',
  'Podcast',
  'Media',
  'Launch',
  'Search',
  'Highlight',
  'Featured',
  'Tag cloud',
  'Grid',
  'Profile',
  'Activity',
  'Chart',
  'Alert',
  'Warning',
  'Info',
  'Pinned',
] as const

/**
 * Generates a long list of block object types for the nested blocks array.
 * Each type gets a distinct icon for the insert menu grid view.
 */
function createBlockTypeDefinitions(count: number = BLOCK_TYPE_COUNT) {
  return Array.from({length: count}, (_, index) => {
    const name = `blockType${index + 1}`
    const title = BLOCK_TYPE_LABELS[index] ?? `Block ${index + 1}`

    return defineArrayMember({
      type: 'object',
      name,
      title,
      icon: BLOCK_TYPE_ICONS[index % BLOCK_TYPE_ICONS.length],
      fields: [
        defineField({
          name: 'label',
          type: 'string',
          title: 'Label',
        }),
      ],
    })
  })
}

const sectionObject = defineArrayMember({
  type: 'object',
  name: 'section',
  title: 'Section',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
    }),
    defineField({
      name: 'blocks',
      type: 'array',
      title: 'Blocks',
      description:
        'Nested array with 24 block types. Open this section in the enhanced object dialog, then add a block to reproduce the clipped insert menu.',
      of: createBlockTypeDefinitions(),
      options: {
        insertMenu: {
          filter: 'auto',
          showIcons: true,
          views: [{name: 'grid'}, {name: 'list'}],
        },
      },
    }),
  ],
})

export const nestedArrayInsertMenuRepro = defineType({
  name: 'nestedArrayInsertMenuRepro',
  type: 'document',
  title: 'Nested array insert menu repro',
  description:
    'Array of objects → section object → blocks array with a long insert menu (5.22.0 clipping repro).',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      initialValue: 'Nested array insert menu repro',
    }),
    defineField({
      name: 'notes',
      type: 'text',
      title: 'How to reproduce',
      readOnly: true,
      initialValue: [
        '1. Add a section to the Sections array below.',
        '2. Open the section (enhanced object dialog).',
        '3. In Blocks, click Add (or use the insert menu between items).',
        '4. Expected: insert menu overflows the dialog and scrolls through all block types.',
        '5. Bug (5.22.0): menu is clipped inside the dialog and only shows a small portion.',
      ].join('\n'),
    }),
    defineField({
      name: 'sections',
      type: 'array',
      title: 'Sections',
      description: 'Array of section objects. Each section contains the nested blocks array.',
      of: [sectionObject],
    }),
  ],
})
