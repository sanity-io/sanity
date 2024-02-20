import {defineType} from 'sanity'

export const taskSchema = defineType({
  type: 'document',
  name: 'tasks.task',
  liveEdit: true,
  fields: [
    {
      type: 'string',
      title: 'Title',
      name: 'title',
    },
  ],
})
