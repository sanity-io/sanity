/* eslint-disable max-nested-callbacks */
import React from 'react'
import {BoldIcon, PlugIcon} from '@sanity/icons'
import {
  BlockAnnotationProps,
  BlockProps,
  defineArrayMember,
  defineField,
  defineType,
  isPortableTextSpan,
  isPortableTextTextBlock,
} from 'sanity'
import {Text} from '@sanity/ui'
import {
  BlackListLocation,
  PortableTextInputWithSpecialCharacters,
} from './PortableTextInputWithSpecialChars'

const renderAnnotation = (props: BlockAnnotationProps) => {
  return props.renderDefault(props)
}

const renderInlineBlock = (props: BlockProps) => {
  return props.renderDefault(props)
}

const renderBlock = (props: BlockProps) => {
  return props.renderDefault(props)
}

const customObject = defineArrayMember({
  type: 'object',
  name: 'customObject',
  title: 'Custom Object',
  fields: [{type: 'string', name: 'someString', validation: (Rule) => Rule.required()}],
  components: {
    annotation: renderAnnotation,
    block: renderBlock,
    inlineBlock: renderInlineBlock,
  },
  icon: PlugIcon,
})

const customBlock = defineArrayMember({
  type: 'block',
  marks: {
    annotations: [customObject],
    decorators: [
      {
        title: 'Strong',
        value: 'strong',
        icon: BoldIcon,
      },
    ],
  },
  styles: [
    {
      title: 'Lead',
      value: 'lead',
      component(props) {
        return (
          <Text weight="bold" size={3}>
            {props.children}
          </Text>
        )
      },
    },
  ],
  of: [defineArrayMember({...customObject, title: `${customObject.title} (inline)`})],
  options: {
    spellCheck: true,
  },
  validation: (Rule) => [
    Rule.error().custom((value, context) => {
      const blacklist: {regExp: RegExp; message: string}[] = [
        {
          message: 'Use n-dash (–) instead',
          regExp: new RegExp(/^- /g),
        },
        {
          message: 'Use a bulleted list instead',
          regExp: new RegExp(/^\* /g),
        },
        {
          message: 'Never write foo',
          regExp: new RegExp(/\bfoo\b/g),
        },
      ]
      const {path} = context
      const locations: BlackListLocation[] = []
      if (path && isPortableTextTextBlock(value)) {
        value.children.forEach((child) => {
          if (isPortableTextSpan(child)) {
            blacklist.forEach((entry) => {
              const matches = isPortableTextSpan(child) && child.text.matchAll(entry.regExp)
              if (matches) {
                Array.from(matches).forEach((match) => {
                  locations.push({
                    span: child,
                    matchText: match[0],
                    path: path.concat(['children', {_key: child._key}]),
                    offset: match.index || 0,
                    message: entry.message,
                    level: 'error',
                  })
                })
              }
            })
          }
        })
      }
      if (locations.length) {
        return {
          message: `${locations.map((item) => item.message).join('. ')}.`,
          metaData: {id: 'blacklistMatchLocations', blacklistMatchLocations: locations},
        }
      }
      return true
    }),
  ],
})

const blockArray = defineField({
  name: 'body',
  title: 'Body',
  type: 'array',
  of: [customBlock, customObject],
  components: {
    input: PortableTextInputWithSpecialCharacters,
  },
})

export default defineType({
  name: 'customBlockTypeDocument',
  title: 'Custom block type',
  type: 'document',
  fields: [blockArray],
})
