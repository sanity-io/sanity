/* eslint-disable func-name-matching */
// import {FaPuzzlePiece as icon} from 'react-icons/fa'

import {defineType, FormPatch, set, TransformPatches} from 'sanity'
import React, {useCallback} from 'react'

export const myObject = defineType({
  type: 'object',
  name: 'myObject',
  title: 'My object',
  // icon,
  // readOnly: true,
  fields: [
    {
      name: 'first',
      type: 'string',
      title: 'First',
    },
    {
      name: 'second',
      type: 'string',
      title: 'Second',
    },
    {
      name: 'third',
      type: 'image',
      title: 'Image',
    },
    {
      name: 'fourth',
      type: 'file',
      title: 'File',
    },
  ],
})

export default defineType({
  name: 'objectsTest',
  type: 'document',
  title: 'Objects test',
  // readOnly: true,
  preview: {
    select: {
      title: 'myObject.first',
    },
  },
  components: {
    input: function Input(props) {
      const transformPatches = useCallback((patches: FormPatch[]) => {
        if (patches.some((patch) => patch.type === 'set' && patch.value === 'what date is it?')) {
          return [...patches, set(new Date().toString(), ['myObject', 'second'])]
        }
        return patches
      }, [])
      return (
        <TransformPatches transform={transformPatches}>
          {props.renderDefault(props)}
        </TransformPatches>
      )
    },
  },
  fieldsets: [{name: 'recursive', title: 'Recursive', options: {collapsible: true}}],
  fields: [
    {
      type: 'object',
      name: 'objectWithColumns',
      title: 'Object with columns',
      options: {
        columns: 4,
      },
      fields: [
        {
          type: 'string',
          title: 'String 1',
          name: 'string1',
        },
        {
          type: 'string',
          title: 'String 2',
          name: 'string2',
        },
        {
          type: 'number',
          title: 'Number 1',
          name: 'number1',
        },
        {
          type: 'number',
          title: 'Number 2',
          name: 'number2',
        },
        {
          type: 'image',
          title: 'Image 1',
          name: 'image1',
        },
        {
          name: 'file',
          type: 'file',
          title: 'File',
        },
      ],
    },
    {
      name: 'myObject',
      type: 'myObject',
      title: 'MyObject',
      description: 'The first field here should be the title',
    },
    {
      name: 'fieldWithObjectType',
      title: 'Field of object type',
      type: 'object',
      description:
        'This is a field of (anonymous, inline) object type. Values here should never get a `_type` property',
      // readOnly: true,
      // hidden: true,
      options: {collapsible: true},
      fields: [
        {
          name: 'field1',
          type: 'string',
          description: 'This is a string field',
          // readOnly: true,
        },
        {
          name: 'field2',
          type: 'myObject',
          title: 'A field of myObject 1',
          description: 'This is another field of "myObject"',
          readOnly: true,
        },
        {
          name: 'field3',
          type: 'myObject',
          title: 'A field of myObject 2',
          description: 'This is another field of "myObject"',
          hidden: ({parent}) => parent?.field1 === 'hide-field-3',
        },
      ],
    },
    {
      name: 'recursive',
      title: 'This field is of type objectsTest',
      type: 'objectsTest',
      fieldset: 'recursive',
    },
    {
      name: 'collapsibleObject',
      title: 'Collapsible object',
      type: 'object',
      options: {collapsible: true, collapsed: false},
      description:
        'This is a field of (anonymous, inline) object type. Values here should never get a `_type` property',
      fields: [
        {name: 'field1', type: 'string', description: 'This is a string field'},
        {name: 'field2', type: 'string', description: 'This is a collapsed field'},
        {
          name: 'field3',
          type: 'object',
          options: {collapsible: true, collapsed: true},
          fields: [
            {name: 'nested1', title: 'nested1', type: 'string'},
            {
              name: 'nested2',
              title: 'nested2',
              type: 'object',
              fields: [
                {name: 'ge', title: 'hello', type: 'string', validation: (Rule) => Rule.required()},
              ],
              options: {collapsible: true, collapsed: true},
            },
          ],
        },
      ],
    },
    {
      name: 'events',
      title: 'Events',
      type: 'array',
      of: [
        {
          name: 'mbwEvent',
          type: 'object',
          preview: {
            select: {
              where: 'where',
              what: 'what',
            },
            prepare({where, what}) {
              return {
                title: where as string,
                subtitle: ((what as string[]) || []).join(', '),
                media: () => ((where as string) || '').slice(0, 1),
              }
            },
          },
          fields: [
            {
              name: 'where',
              title: 'Where',
              description: 'Victoriagade? Baghaven? Koelschip?',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'what',
              title: 'What',
              description: 'Party? Bottle release? Tap takeover?',
              type: 'array',
              of: [{type: 'string'}],
              validation: (Rule) => Rule.min(1),
            },
          ],
        },
      ],
    },
  ],
})
