import {BoldIcon, ItalicIcon, LinkIcon} from '@sanity/icons'
import {Schema} from '@sanity/schema'
import {defineField, defineType} from '@sanity/types'
import {ScratchPadInput} from '../components/editor/Input'
import {fragmentToAssistantText} from '../utils/toAssistantText'

const blockType = defineField({
  type: 'block',
  name: 'block',
  validation: (Rule) =>
    Rule.custom<any>((block) => {
      const text = fragmentToAssistantText(block ? [block] : [])
      return text.length === 1 ? 'Please write a longer paragraph.' : true
    }),
})

export const portableTextType = defineType({
  type: 'array',
  name: 'portableText',
  of: [blockType],
  components: {
    input: ScratchPadInput,
  },
})

export const document = defineType({
  type: 'object',
  name: 'scratchPadDocument',
  title: 'ScratchPad Document',
  fields: [defineField(portableTextType)],
})

export const schema = Schema.compile({
  name: 'scratchPad',
  types: [document, portableTextType],
})

export const editorSchemaType = schema.get('portableText')
