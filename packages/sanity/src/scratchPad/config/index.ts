import {Schema} from '@sanity/schema'
import {defineField, defineType} from '@sanity/types'
import {
  BoldIcon,
  CodeIcon,
  ItalicIcon,
  LinkIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from '@sanity/icons'
import {ScratchPadInput} from '../components/editor/Input'
import {fragmentToAssistantText} from '../utils/toAssistantText'
import ScratchPadBlock from '../components/editor/blocks/Block'

export const decoratorsMap = [
  {
    name: 'strong',
    title: 'Strong',
    hotkey: 'b',
    icon: BoldIcon,
  },
  {
    name: 'em',
    title: 'Italic',
    hotkey: 'i',
    icon: ItalicIcon,
  },
  {
    name: 'underline',
    title: 'Underline',
    hotkey: 'u',
    icon: UnderlineIcon,
  },
  {
    name: 'code',
    title: 'Code',
    hotkey: "'",
    icon: CodeIcon,
  },
  {
    name: 'strike',
    title: 'Strike',
    hotkey: undefined,
    icon: StrikethroughIcon,
  },
]

const blockType = defineField({
  type: 'block',
  name: 'block',
  marks: {
    decorators: decoratorsMap.map((d) => ({title: d.title, value: d.name, icon: d.icon})),
    annotations: [
      {
        type: 'object',
        name: 'link',
        icon: LinkIcon,
        options: {
          modal: {type: 'popover'},
        },
        fields: [
          {
            name: 'href',
            type: 'url',
            title: 'Link',
            description: 'A valid web, email, phone, or relative link.',
            validation: (Rule) =>
              Rule.uri({
                scheme: ['http', 'https', 'tel', 'mailto'],
                allowRelative: true,
              }),
          },
        ],
      },
    ],
  },
  of: [
    {
      type: 'object',
      name: 'test',
      fields: [
        {
          type: 'string',
          name: 'testString',
        },
      ],
    },
  ],
  components: {
    block: ScratchPadBlock,
  },
})

export const portableTextType = defineType({
  type: 'array',
  name: 'portableText',
  of: [blockType],
  components: {
    input: ScratchPadInput,
  },
})

export const documentType = defineType({
  type: 'document',
  name: 'scratchPadDocument',
  title: 'ScratchPad Document',
  fields: [defineField(portableTextType)],
})

export const schema = Schema.compile({
  name: 'scratchPad',
  types: [documentType, portableTextType],
})

export const editorSchemaType = schema.get('portableText')
