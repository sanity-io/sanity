import {SearchIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export const longValidationTestType = defineType({
  type: 'document',
  name: 'longValidationTest',
  title: 'Long validation test',
  icon: SearchIcon,
  fields: [
    defineField({
      type: 'string',
      name: 'name',
      title: 'Name',
    }),
  ],
  validation: (Rule) =>
    Rule.custom(async () => {
      // Sleep 1 second
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Ask for confirmation
      // eslint-disable-next-line no-alert
      const confirmation = window.confirm('Pass validation?')
      if (confirmation) {
        return true
      }
      return 'Validation failed'
    }),
})
