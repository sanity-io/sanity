import {defineArrayMember, defineField, defineType} from 'sanity'

const conditionValueObjectMember = defineArrayMember({
  name: 'variantConditionValueObject',
  title: 'Detailed value',
  type: 'object',
  fields: [
    defineField({
      name: 'value',
      title: 'Value',
      type: 'string',
      validation: (Rule) => Rule.required().error('A value is required'),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      value: 'value',
    },
    prepare(selection) {
      const title = selection.title || selection.value
      return {
        title,
        subtitle: selection.value,
      }
    },
  },
})

const conditionDefinitionObjectMember = defineArrayMember({
  name: 'variantConditionDefinition',
  title: 'Condition',
  type: 'object',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'Machine-readable key, for example "audience" or "locale".',
      validation: (Rule) =>
        Rule.required()
          .regex(/^[a-z][a-z0-9_-]{0,63}$/)
          .error('Use lowercase letters, numbers, _ or -, and start with a letter'),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'values',
      title: 'Values',
      description: 'Use value objects, with optional title and description.',
      type: 'array',
      of: [conditionValueObjectMember],
      validation: (Rule) => Rule.required().min(1).error('Add at least one value'),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      name: 'name',
      values: 'values',
    },
    prepare(selection) {
      const valuesCount = Array.isArray(selection.values) ? selection.values.length : 0
      const title = selection.title || selection.name

      return {
        title,
        subtitle: `${selection.name} (${valuesCount} values)`,
      }
    },
  },
})

export const variantConditionsSingleton = defineType({
  name: 'variantConditions',
  title: 'Variant conditions',
  type: 'document',
  fields: [
    defineField({
      name: 'conditions',
      title: 'Conditions',
      type: 'array',
      of: [conditionDefinitionObjectMember],
      validation: (Rule) => Rule.required(),
    }),
  ],
  initialValue: {
    conditions: [
      {
        name: 'audience',
        title: 'Audience',
        description: 'Who this content is for.',
        values: [
          {
            value: 'loyal',
            title: 'Loyal customers',
            description: 'Repeat purchasers and members.',
          },
          {
            value: 'new',
            title: 'New visitors',
            description: 'First-time visitors to the site.',
          },
        ],
      },
      {
        name: 'locale',
        title: 'Locale',
        description: 'The visitor language and region.',
        values: [{value: 'en-US'}, {value: 'nb-NO'}, {value: 'de-DE'}],
      },
    ],
  },
  preview: {
    prepare() {
      return {
        title: 'Variant conditions',
        subtitle: 'Singleton document',
      }
    },
  },
})
