import {defineField, defineType} from '@sanity/types'

import {type ArrayFieldProps, type ObjectFieldProps} from '../../../../form'
import {TASK_STATUS} from '../../../constants/TaskStatus'
import {type FormMode} from '../../../types'
import {
  AssigneeCreateFormField,
  DescriptionInput,
  FieldWrapper,
  TargetField,
  TitleField,
} from '../fields'
import {FormCreate} from '../tasksFormBuilder/FormCreate'
import {FormEdit} from '../tasksFormBuilder/FormEdit'
import {TasksNotificationTarget} from '../tasksFormBuilder/TasksNotificationTarget'

const targetContentField = (mode: FormMode) =>
  defineField({
    type: 'object',
    name: 'target',
    title: 'Target',
    components: {
      field: (props: ObjectFieldProps) => <TargetField {...props} mode={mode} />,
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
  })

const descriptionInputField = (mode: FormMode) =>
  defineField({
    type: 'array',
    name: 'description',
    title: 'Description',
    components: {
      field: (props: ArrayFieldProps) => <DescriptionInput {...props} mode={mode} />,
    },
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
  })
export const taskSchema = (mode: FormMode) =>
  defineType({
    type: 'document',
    name: 'tasks.task',
    liveEdit: true,
    components: {
      input: mode === 'edit' ? FormEdit : FormCreate,
    },
    fields: [
      {
        type: 'string',
        title: 'Title',
        name: 'title',
        placeholder: 'Task title',
        components: {
          field: TitleField,
        },
        hidden: mode === 'edit',
      },
      ...(mode === 'edit'
        ? [targetContentField(mode), descriptionInputField(mode)]
        : [descriptionInputField(mode), targetContentField(mode)]),
      {
        type: 'string',
        name: 'assignedTo',
        title: 'Assign to',
        placeholder: 'Select assignee',
        components: {
          field: FieldWrapper,
          input: AssigneeCreateFormField,
        },
        hidden: mode === 'edit',
      },
      {
        type: 'date',
        name: 'dueBy',
        title: 'Deadline',
        placeholder: 'yyyy-mm-dd',
        components: {
          field: FieldWrapper,
        },
        hidden: mode === 'edit',
      },
      {
        type: 'string',
        name: 'authorId',
        hidden: true,
      },
      {
        type: 'string',
        name: 'createdByUser',
        hidden: true,
      },
      {
        type: 'array',
        of: [{type: 'string'}],
        name: 'subscribers',
        hidden: true,
      },
      {
        type: 'string',
        name: 'status',
        title: 'Status',
        options: {
          list: TASK_STATUS.map((s) => ({value: s.value, title: s.title})),
        },
        hidden: true,
      },
      {
        type: 'object',
        name: 'context',
        components: {
          field: TasksNotificationTarget,
        },
        fields: [
          {
            type: 'object',
            name: 'notification',
            fields: [
              {
                type: 'string',
                name: 'url',
              },
              {
                type: 'string',
                name: 'workspaceTitle',
              },
              {
                type: 'string',
                name: 'targetContentImageUrl',
              },
              {
                type: 'string',
                name: 'targetContentTitle',
              },
            ],
          },
        ],
      },
    ],
  })
