import {MdTextFormat as icon} from 'react-icons/md'
import {HooksBasedStringInput} from '../src/components/HooksBasedStringInput'

export default {
  name: 'stringsTest',
  type: 'document',
  title: 'Strings test',
  icon,
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title',
      description: 'This is a basic string field',
    },
    {
      name: 'hooksBasedInput',
      type: 'string',
      title: 'Hooks based input',
      description: 'A string field with a custom input (using react hooks)',
      inputComponent: HooksBasedStringInput,
    },
    {
      name: 'readonlyField',
      type: 'string',
      title: 'A read only string',
      description: 'It may have a value, but it cannot be edited',
      readOnly: true,
    },
    {
      name: 'select',
      type: 'string',
      title: 'Select string',
      description:
        'Select a single string value from a set of predefined options. It should be possible to unset a selected value.',
      options: {
        list: [
          {
            title: 'One (1)',
            value: 'one',
          },
          {
            title: 'Two (2)',
            value: 'two',
          },
          {
            title: 'Three (3)',
            value: 'three',
          },
        ],
      },
    },
    {
      name: 'radioSelectHorizontal',
      title: 'Select (layout: radio, direction: horizontal)',
      type: 'string',
      description:
        'Select a single string value by choosing options from a list of radio buttons. It should *not* be possible to unset a selected value once its set.',
      options: {
        layout: 'radio',
        direction: 'horizontal',
        list: [
          {
            title: 'One (1)',
            value: 'one',
          },
          {
            title: 'Two (2)',
            value: 'two',
          },
          {
            title: 'Three (3)',
            value: 'three',
          },
        ],
      },
    },
    {
      name: 'selectObjectOfString',
      title: 'Select string in object',
      description:
        'Select a single string value from an array of strings. It should be possible to unset a selected value.',
      type: 'string',
      options: {
        list: ['one', 'two', 'three'],
      },
    },
    {
      name: 'radioSelect',
      title: 'Select (layout: radio)',
      type: 'string',
      description:
        'Select a single string value by choosing options from a list of radio buttons. It should *not* be possible to unset a selected value once its set.',
      options: {
        layout: 'radio',
        direction: 'vertical',
        list: [
          {
            title: 'One (1)',
            value: 'one',
          },
          {
            title: 'Two (2)',
            value: 'two',
          },
          {
            title: 'Three (3)',
            value: 'three',
          },
        ],
      },
    },
    {
      name: 'localeTitle',
      title: 'Localized title',
      type: 'localeString',
      description: 'English required by localeString, swedish from field',
      validation: (Rule) =>
        Rule.fields({
          se: (fieldRule) => fieldRule.required().max(80),
        }),
    },
  ],
}
