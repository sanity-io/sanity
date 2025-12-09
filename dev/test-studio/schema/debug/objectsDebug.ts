import {
  defineArrayMember,
  defineField,
  defineType,
  type InputProps,
  type PortableTextInputProps,
} from 'sanity'

import {SideBySideObjectInput, SideBySideObjectItem} from './components/SideBySideObjectInput'
import {CustomEnhancedObjectField} from './customEnhancedObjectField'
import {CustomEnhancedObjectInput} from './customEnhancedObjectInput'
import {PageBlockAnchor} from './PageBlockAnchor'

const animal = defineField({
  type: 'object',
  name: 'animal',
  title: 'Animal',
  fields: [
    {
      name: 'name',
      type: 'string',
      title: 'Animal name',
    },
    {
      name: 'arrayOfNumbersAnimals',
      type: 'array',
      title: 'Array of numbers animals',
      of: [
        {
          type: 'number',
          title: 'Number',
        },
      ],
    },
    {
      type: 'array',
      name: 'description',
      title: 'Description',
      of: [
        {type: 'block'},
        {
          type: 'object',
          name: 'info',
          fields: [
            {
              type: 'array',
              name: 'item',
              title: 'Item',
              of: [
                {
                  type: 'object',
                  name: 'property',
                  title: 'Property',
                  fields: [
                    {
                      type: 'string',
                      name: 'title',
                      title: 'Title',
                      validation: (Rule) => Rule.required(),
                    },
                    {
                      type: 'string',
                      name: 'value',
                      title: 'Value',
                    },
                    {
                      type: 'array',
                      name: 'description_two',
                      title: 'Description Two',
                      components: {
                        input: (props: any) => {
                          return props.renderDefault({...props, initialFullscreen: true})
                        },
                      },
                      of: [
                        {type: 'block'},
                        {
                          type: 'object',
                          name: 'info_two',
                          title: 'Info Two',
                          fields: [
                            {
                              type: 'array',
                              name: 'item_two',
                              title: 'Item Two',
                              of: [
                                {
                                  type: 'object',
                                  name: 'property_two',
                                  title: 'Property Two',
                                  fields: [
                                    {
                                      type: 'string',
                                      name: 'title_two',
                                      title: 'Title Two',
                                      validation: (Rule) => Rule.required(),
                                    },
                                    {
                                      type: 'string',
                                      name: 'value_two',
                                      title: 'Value Two',
                                    },
                                    {
                                      type: 'array',
                                      name: 'description_three',
                                      title: 'Description Three',
                                      of: [
                                        {type: 'block'},
                                        {
                                          type: 'object',
                                          name: 'info_three',
                                          title: 'Info Three',
                                          fields: [
                                            {
                                              type: 'string',
                                              name: 'title_three',
                                              title: 'Title Three',
                                            },
                                          ],
                                          components: {
                                            input: (inputProps: any) => {
                                              return inputProps.renderDefault(inputProps)
                                            },
                                          },
                                        },
                                      ],
                                    },
                                    {
                                      type: 'internationalizedArrayString',
                                      name: 'internationalizedArrayString',
                                      title: 'Internationalized array string',
                                    },

                                    {
                                      type: 'image',
                                      name: 'imageChild',
                                      title: 'Image',
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: 'image',
                          name: 'image_two',
                          title: 'Image',
                        },
                      ],
                    },
                    defineField({
                      name: 'content',
                      type: 'array',
                      of: [
                        defineArrayMember({
                          name: 'something',
                          type: 'block',
                          of: [
                            defineArrayMember({
                              name: 'nested',
                              type: 'object',
                              fields: [
                                defineField({
                                  name: 'items',
                                  type: 'array',
                                  of: [
                                    defineArrayMember({
                                      name: 'item',
                                      type: 'object',
                                      fields: [
                                        defineField({
                                          name: 'deep',
                                          type: 'array',
                                          of: [
                                            defineArrayMember({
                                              type: 'block',
                                              styles: [
                                                {title: 'Normal', value: 'normal'},
                                                {title: 'H2', value: 'h2'},
                                                {title: 'H3', value: 'h3'},
                                                {title: 'H4', value: 'h4'},
                                              ],
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                },
              ],
            },
            {
              name: 'arrayOfObjects__deep',
              type: 'array',
              title: 'Array of objects',
              of: [
                {
                  type: 'object',
                  name: 'myObject',
                  fields: [
                    {
                      name: 'string',
                      type: 'string',
                      title: 'String',
                    },
                  ],
                },
                {
                  type: 'reference',
                  name: 'author',
                  title: 'Author',
                  to: [{type: 'author'}],
                },
              ],
            },
          ],
        },
        {
          type: 'image',
          name: 'image',
          title: 'Image',
        },
      ],
    },
    {
      name: 'arrayOfObjects__flat',
      type: 'array',
      title: 'Array of objects',
      of: [
        {
          type: 'object',
          name: 'myObject',
          fields: [
            {
              name: 'string',
              type: 'string',
              title: 'String',
            },
          ],
        },
        {
          type: 'reference',
          name: 'author',
          title: 'Author',
          to: [{type: 'author'}],
        },
        {
          type: 'reference',
          name: 'species',
          title: 'Species',
          to: [{type: 'species'}],
        },
      ],
    },
    {
      name: 'arrayWithNoTitle',
      title: 'Array with custom field',
      type: 'array',
      components: {
        field: CustomEnhancedObjectField,
        input: CustomEnhancedObjectInput,
      },
      of: [
        {
          type: 'object',
          name: 'obj',
          title: 'Some object',
          fields: [
            {
              name: 'title',
              type: 'string',
            },
            {
              name: 'description',
              type: 'string',
            },
          ],
        },
      ],
    },
    {
      type: 'array',
      name: 'children',
      title: 'Children',
      of: [
        {
          type: 'object',
          name: 'child',
          fields: [
            {
              name: 'nameChild',
              type: 'string',
              title: 'Name Child',
            },
            {
              type: 'internationalizedArrayString',
              name: 'internationalizedArrayStringChild',
              title: 'Internationalized array string',
            },
          ],
        },
      ],
    },
    {
      type: 'array',
      name: 'childrenWithComponents',
      title: 'Children with components',
      of: [
        {
          type: 'object',
          name: 'child',
          components: {
            item: SideBySideObjectItem,
            input: SideBySideObjectInput,
          },
          fields: [
            {
              name: 'nameChild',
              type: 'string',
              title: 'Name Child',
            },
            {
              type: 'internationalizedArrayString',
              name: 'internationalizedArrayStringChild',
              title: 'Internationalized array string',
            },
          ],
        },
      ],
    },
    {
      name: 'size',
      type: 'object',
      title: 'Size',
      fields: [
        {
          name: 'width',
          type: 'number',
          title: 'Width',
        },
        {
          name: 'height',
          type: 'number',
          title: 'Height',
        },
      ],
    },
    {
      name: 'countries',
      type: 'array',
      title: 'Countries',
      of: [
        {
          type: 'string',
          title: 'Country',
        },
      ],
    },
    {
      type: 'array',
      name: 'friends',
      of: [
        {
          type: 'object',
          name: 'friend',
          fields: [
            {
              name: 'name',
              type: 'string',
              title: 'Friend name',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'age',
              type: 'number',
              title: 'Friend age',
            },
            {
              name: 'properties',
              type: 'array',
              title: 'Friend properties',
              of: [
                {
                  type: 'object',
                  name: 'property',
                  title: 'Property',
                  fields: [
                    {
                      type: 'string',
                      name: 'title',
                      title: 'Title',
                    },
                    {
                      name: 'properties_b',
                      type: 'array',
                      title: 'Friend properties',
                      of: [
                        {
                          type: 'object',
                          name: 'property_b',
                          title: 'Property',
                          fields: [
                            {
                              type: 'string',
                              name: 'title',
                              title: 'Title',
                            },
                            {
                              name: 'properties_c',
                              type: 'array',
                              title: 'Friend properties',
                              of: [
                                {
                                  type: 'object',
                                  name: 'property_d',
                                  title: 'Property',
                                  fields: [
                                    {
                                      type: 'string',
                                      name: 'title',
                                      title: 'Title',
                                    },
                                    {
                                      type: 'internationalizedArrayString',
                                      name: 'internationalizedArrayString',
                                      title: 'Internationalized array string',
                                    },
                                    {
                                      name: 'properties_d',
                                      type: 'array',
                                      title: 'Friend properties',
                                      of: [
                                        {
                                          type: 'object',
                                          name: 'property_b',
                                          title: 'Property',
                                          fields: [
                                            {
                                              type: 'string',
                                              name: 'title',
                                              title: 'Title',
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
})

const body = defineField({
  type: 'array',
  name: 'body',
  title: 'Body',
  of: [
    {
      type: 'block',
      name: 'block',
      title: 'Block',
    },
    defineArrayMember({
      name: 'nested',
      type: 'object',
      fields: [
        defineField({
          name: 'items',
          type: 'array',
          of: [
            defineArrayMember({
              name: 'item',
              type: 'object',
              fields: [
                defineField({
                  name: 'deep',
                  type: 'array',
                  of: [
                    defineArrayMember({
                      type: 'block',
                      styles: [
                        {title: 'Normal', value: 'normal'},
                        {title: 'H2', value: 'h2'},
                        {title: 'H3', value: 'h3'},
                        {title: 'H4', value: 'h4'},
                      ],
                    }),
                  ],
                  components: {
                    input: (inputProps: InputProps) => {
                      const editorProps = {
                        ...inputProps,
                        initialActive: false,
                      } as PortableTextInputProps
                      return inputProps.renderDefault(editorProps)
                    },
                  },
                }),
              ],
            }),
          ],

          components: {
            input: (inputProps: InputProps) => {
              return inputProps.renderDefault({...inputProps, initialActive: false})
            },
          },
        }),
      ],
    }),
    animal,
    defineArrayMember({
      type: 'object',
      name: 'arrayOfObjects',
      fields: [
        {
          type: 'string',
          name: 'string',
          title: 'String',
        },
      ],
      components: {
        input: (inputProps: any) => {
          return inputProps.renderDefault(inputProps)
        },
      },
    }),
  ],
})

const pte = defineField({
  name: 'pte',
  type: 'object',
  title: 'PTE',
  fields: [
    {
      type: 'array',
      name: 'body',
      of: [{type: 'block'}, animal],
    },
  ],
})

const animals = defineField({
  type: 'array',
  name: 'animals',
  title: 'Animals',
  of: [animal],
})

const fieldsetArray = defineField({
  type: 'array',
  name: 'fieldsetArray',
  title: 'Fieldset array',

  fieldset: 'fieldset',

  of: [
    {
      type: 'object',
      name: 'myObject',
      fields: [
        {
          name: 'string',
          type: 'string',
          title: 'String',
        },
      ],
    },
  ],
})

const arrayOfImages = defineField({
  type: 'array',
  name: 'arrayOfImages',
  title: 'Array of images',
  of: [
    {
      type: 'image',
      name: 'image',
      title: 'Image',
    },
  ],
})

const arrayOfFiles = defineField({
  type: 'array',
  name: 'arrayOfFiles',
  title: 'Array of files',
  of: [
    {
      type: 'file',
      name: 'file',
      title: 'File',
    },
  ],
})

const arrayOfAnonymousObjects = defineField({
  type: 'array',
  name: 'arrayOfAnonymousObjects',
  title: 'Array of anonymous objects',
  of: [
    {
      type: 'object',
      fields: [
        {
          name: 'anonymousString',
          type: 'string',
          title: 'Anonymous string',
        },
      ],
    },
  ],
})

const objectWithArray = defineField({
  type: 'object',
  name: 'objectWithArray',
  title: 'Object with array',
  fields: [
    {
      type: 'array',
      name: 'animalss',
      title: 'Animals',
      of: [animal],
    },
  ],
})

const arrayOfMixedTypes = defineField({
  type: 'array',
  name: 'arrayOfMixedTypes',
  title: 'Array of mixed types',
  of: [
    pte,
    {
      type: 'object',
      name: 'myObject',
      fields: [
        {
          name: 'string',
          type: 'string',
          title: 'String',
        },
        // Array of objects
        {
          name: 'arrayOfObjects',
          type: 'array',
          title: 'Array of objects',
          of: [
            {
              type: 'object',
              name: 'myObject',
              fields: [
                {
                  name: 'string',
                  type: 'string',
                  title: 'String',
                },
              ],
            },
            {
              type: 'reference',
              name: 'author',
              title: 'Author',
              to: [{type: 'author'}],
            },
          ],
        },
      ],
    },
    {
      type: 'image',
      name: 'image',
      title: 'Image',
    },
    {
      name: 'author',
      type: 'reference',
      title: 'Author',
      to: [{type: 'author'}],
    },
    {
      type: 'object',
      name: 'mixedObject',
      title: 'Mixed object',
      fields: [
        {
          name: 'author',
          type: 'reference',
          title: 'Author',
          to: [{type: 'author'}],
        },
      ],
      preview: {
        select: {
          title: 'author.name',
        },
        prepare({title}) {
          return {
            title,
          }
        },
      },
    },
  ],
})

const arrayWithArrayInNestedObjects = defineField({
  type: 'object',
  name: 'rootObject',
  fields: [
    {
      type: 'array',
      name: 'level1Array',
      title: 'Level 1 Array',
      of: [
        {
          type: 'object',
          name: 'level1Object',
          fields: [
            {
              type: 'string',
              name: 'title',
              title: 'Title',
            },
            {
              type: 'object',
              name: 'level2Object',
              fields: [
                {
                  type: 'string',
                  name: 'title',
                  title: 'Title',
                },
                {
                  type: 'array',
                  name: 'level2Array',
                  title: 'Level 2 Array',
                  of: [
                    {
                      type: 'object',
                      name: 'level2ArrayObject',
                      fields: [
                        {
                          type: 'string',
                          name: 'title',
                          title: 'Title',
                        },
                        {
                          type: 'object',
                          name: 'level3Object',
                          fields: [
                            {
                              type: 'string',
                              name: 'title',
                              title: 'Title',
                            },
                            {
                              type: 'object',
                              name: 'level3NestedObject',
                              title: 'Level 3 Nested Object',
                              fields: [
                                {
                                  type: 'string',
                                  name: 'title',
                                  title: 'Title',
                                },
                                {
                                  type: 'object',
                                  name: 'level3NestedNestedObject',
                                  title: 'Level 3 Nested Nested Object',
                                  fields: [
                                    {
                                      type: 'string',
                                      name: 'title',
                                      title: 'Title',
                                    },
                                    {
                                      type: 'object',
                                      name: 'level3DeepNestedObject',
                                      title: 'Level 3 Deep Nested Object',
                                      fields: [
                                        {
                                          type: 'string',
                                          name: 'title',
                                          title: 'Title',
                                        },
                                        {
                                          type: 'array',
                                          name: 'level3DeepNestedArray1',
                                          title: 'Level 3 Array 1',
                                          of: [
                                            {
                                              type: 'object',
                                              name: 'level3DeepNestedArrayObject1',
                                              fields: [
                                                {
                                                  type: 'string',
                                                  name: 'title',
                                                  title: 'Title',
                                                },
                                                {
                                                  type: 'array',
                                                  name: 'level3DeepNestedArray1',
                                                  title: 'Level 3 Nested Array 1',
                                                  of: [
                                                    {
                                                      type: 'object',
                                                      name: 'level3DeepNestedArrayObject1',
                                                      fields: [
                                                        {
                                                          type: 'string',
                                                          name: 'title',
                                                          title: 'Title',
                                                        },
                                                      ],
                                                    },
                                                  ],
                                                },
                                                {
                                                  type: 'array',
                                                  name: 'level3DeepNestedArray2',
                                                  title: 'Level 3 Nested Array 2',
                                                  of: [
                                                    {
                                                      type: 'object',
                                                      name: 'level3DeepNestedArrayObject2',
                                                      fields: [
                                                        {
                                                          type: 'string',
                                                          name: 'title',
                                                          title: 'Title',
                                                        },
                                                      ],
                                                    },
                                                  ],
                                                },
                                              ],
                                            },
                                          ],
                                        },
                                        {
                                          type: 'array',
                                          name: 'level3DeepNestedArray2',
                                          title: 'Level 3 Array 2',
                                          of: [
                                            {
                                              type: 'object',
                                              name: 'level3DeepNestedArrayObject2',
                                              fields: [
                                                {
                                                  type: 'string',
                                                  name: 'title',
                                                  title: 'Title',
                                                },
                                              ],
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              name: 'level2AnotherArray',
              type: 'array',
              title: 'Level 2 Another Array',
              of: [
                {
                  type: 'object',
                  name: 'level2AnotherObject',
                  fields: [
                    {
                      type: 'string',
                      name: 'level2AnotherObjectString',
                      title: 'Level 2 Another Object String',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
})

const arrayWithNestedObjectsWithArray = defineField({
  name: 'arrayWithNestedObjectsWithArray',
  type: 'array',
  title: 'Array with nested objects with array',
  of: [
    {
      type: 'object',
      name: 'firstObject',
      title: 'First object',
      fields: [
        {
          type: 'object',
          name: 'secondObject',
          title: 'Second object',
          fields: [
            {
              type: 'array',
              name: 'nestedArray',
              title: 'Nested array',
              of: [
                {
                  type: 'object',
                  name: 'nestedObject',
                  title: 'Nested object',
                  fields: [
                    {
                      type: 'string',
                      name: 'nestedString',
                      title: 'Nested string',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
})

export const objectsDebug = defineType({
  type: 'document',
  name: 'objectsDebug',

  fieldsets: [
    {
      name: 'fieldset',
      title: 'Fieldset',
    },
  ],

  fields: [
    {
      name: 'title',
      type: 'string',
    },
    {
      name: 'arrayOfNumbers',
      type: 'array',
      title: 'Array of numbers',
      of: [
        {
          type: 'number',
          title: 'Number',
        },
      ],
    },
    /** Internationalized array string */
    defineField({
      name: 'greeting',
      type: 'internationalizedArrayString',
    }),
    /** Internationalized array string value */
    defineField({
      name: 'internationalizedArrayStringValue',
      type: 'internationalizedArrayStringValue',
      title: 'Internationalized array string value',
    }),
    defineField({
      name: 'arrayofObjectsWithItem',
      type: 'array',
      title: 'Array of objects with custom item',
      of: [
        {
          type: 'object',
          name: 'item',
          fields: [
            {
              name: 'object1',
              type: 'string',
              title: 'String 1',
            },
          ],
          components: {
            item: PageBlockAnchor,
          },
        },
      ],
    }),
    animals,
    {
      name: 'arrayWithNoTitle_2',
      title: 'Array with custom field 2',
      type: 'array',
      components: {
        field: CustomEnhancedObjectField,
        input: CustomEnhancedObjectInput,
      },
      of: [
        {
          type: 'object',
          name: 'obj_2',
          title: 'Some object',
          fields: [
            {
              name: 'title',
              type: 'string',
            },
            {
              name: 'description',
              type: 'string',
            },
          ],
        },
      ],
    },
    arrayOfMixedTypes,
    body,
    fieldsetArray,
    objectWithArray,
    arrayOfAnonymousObjects,
    arrayOfImages,
    arrayOfFiles,
    arrayWithNestedObjectsWithArray,
    arrayWithArrayInNestedObjects,
  ],
})
