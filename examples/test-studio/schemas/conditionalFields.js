import {timer, of} from 'rxjs'
import {map, distinctUntilChanged, switchMap} from 'rxjs/operators'

export default {
  name: 'conditionalFieldsTest',
  type: 'document',
  title: 'Conditional fields',

  fields: [
    {
      name: 'title',
      type: 'string',
      description: 'Title',
    },
    {
      name: 'isPublished',
      type: 'boolean',
      description: 'Is published?',
    },
    {
      name: 'fieldWithObjectType',
      title: 'Field of object type',
      type: 'object',
      description:
        'This is a field of (anonymous, inline) object type. Values here should never get a `_type` property',
      fields: [
        {
          name: 'field1',
          type: 'string',
          description: 'Try typing "hide field 2" here',
        },
        {
          name: 'field2',
          type: 'string',
          description: 'This will be hidden if you type "hide field 2" into field 1',
          hidden: ({parent}) => parent?.field1 === 'hide field 2',
        },
        {
          name: 'hiddenIfPublished',
          type: 'string',
          description: 'This will be hidden if the document is published',
          hidden: ({document}) => document.isPublished,
        },
        {
          name: 'field3',
          type: 'string',
          description: 'This will be hidden if its value becomes "hideme"',
          hidden: ({value}) => value === 'hideme',
        },
        {
          name: 'async',
          type: 'string',
          description: 'This will hidden be after a second if its value is "hideme"',
          hidden: ({value}) =>
            new Promise((resolve) => setTimeout(resolve, 1000)).then(() => value === 'hideme'),
        },
        {
          name: 'reactive',
          type: 'string',
          description:
            'This will hide and show every other second, but only if the document is published',
          hidden: {
            stream: (context$) =>
              context$.pipe(
                map(({document}) => document.isPublished),
                distinctUntilChanged(),
                switchMap((isPublished) =>
                  isPublished ? timer(0, 1000).pipe(map((n) => n % 2 === 0)) : of(false)
                )
              ),
          },
        },
      ],
    },
  ],
}
