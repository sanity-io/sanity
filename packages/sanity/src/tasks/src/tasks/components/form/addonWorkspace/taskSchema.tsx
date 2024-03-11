import {type ArrayFieldProps, defineField, defineType, type ObjectFieldProps} from 'sanity'

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

const targetContentField = (mode: FormMode) =>
  defineField({
    type: 'object',
    name: 'target',
    title: 'Target content',
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
        title: 'Assigned to',
        placeholder: 'Search username',
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
        placeholder: 'Select date',
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
    ],
  })
