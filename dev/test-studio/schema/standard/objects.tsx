/* eslint-disable func-name-matching */
// import {FaPuzzlePiece as icon} from 'react-icons/fa'

import {useCallback} from 'react'
import {defineField, defineType, type FormPatch, set, TransformPatches} from 'sanity'

export const myObject = defineType({
  type: 'object',
  name: 'myObject',
  title: 'My object',
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'media', title: 'Media'},
  ],
  // icon,
  // readOnly: true,
  fields: [
    {
      name: 'first',
      type: 'string',
      title: 'First',
      group: 'content',
    },
    {
      name: 'second',
      type: 'string',
      title: 'Second',
      group: 'content',
    },
    {
      name: 'third',
      type: 'image',
      title: 'Image',
      group: 'media',
    },
    {
      name: 'fourth',
      type: 'file',
      title: 'File',
      group: 'media',
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
  fieldsets: [
    {name: 'recursive', title: 'Recursive', options: {collapsible: true}},
    {name: 'readOnly', title: 'Read only', options: {collapsible: true}},
  ],
  fields: [
    defineField({
      name: 'arrayOfObjects',
      type: 'array',
      of: [
        {
          title: 'Unnamed Object',
          type: 'object',
          fields: [
            {
              name: 'valueWithNestedValidation',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'someValue',
              type: 'boolean',
              initialValue: true,
            },
          ],
        },
      ],
    }),
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
          description: 'this is a king kong description',
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
  ],
})
