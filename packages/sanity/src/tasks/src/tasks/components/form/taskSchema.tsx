import {defineType} from 'sanity'

import {MentionUserFormField} from './MentionUser'
import {TargetField} from './TargetField'
import {TitleField} from './TitleField'

export const taskSchema = defineType({
  type: 'document',
  name: 'tasks.task',
  liveEdit: true,
  fields: [
    {
      type: 'string',
      title: 'Title',
      name: 'title',
      placeholder: 'Task title',
      components: {
        field: TitleField,
      },
    },
    {
      type: 'array',
      name: 'description',
      title: 'Description',
      of: [
        {
          type: 'block',
          name: 'block',
          of: [
            {
              name: 'mention',
              type: 'object',
              fields: [
                {
                  name: 'userId',
                  type: 'string',
                },
              ],
            },
          ],
          marks: {
            annotations: [],
          },
          styles: [{title: 'Normal', value: 'normal'}],
          lists: [],
        },
      ],
    },
    {
      type: 'object',
      name: 'target',
      title: 'Target content',
      components: {
        field: TargetField,
      },
      fields: [
        {
          name: 'document',
          type: 'crossDatasetReference',
          dataset: 'playground',
          weak: true,
          studioUrl: ({id, type}) => `intent/edit/id=${id};type=${type}/`,
          to: [
            {
              type: 'any_document',
              preview: {
                select: {title: 'title'},
              },
            },
          ],
        },
        {
          name: 'documentType',
          type: 'string',
          title: 'Document type',
        },
      ],
    },
    {
      type: 'string',
      name: 'assignedTo',
      title: 'Assigned to',
      placeholder: 'Search username',
      components: {
        input: MentionUserFormField,
      },
    },
    {
      type: 'date',
      name: 'dueBy',
      title: 'Deadline',
      placeholder: 'Select date',
    },
    {
      type: 'string',
      name: 'authorId',
      hidden: true,
    },
    {
      type: 'string',
      name: 'status',
      title: 'Status',
      options: {
        list: ['open', 'closed'],
      },
      hidden: true,
    },
  ],
})
