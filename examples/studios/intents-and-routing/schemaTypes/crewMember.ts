// @ts-check
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'crewMember',
  title: 'Crew Member',
  type: 'object',
  fields: [
    defineField({
      name: 'department',
      title: 'Department',
      type: 'string',
    }),
    defineField({
      name: 'job',
      title: 'Job',
      type: 'string',
    }),
    defineField({
      name: 'person',
      title: 'Person',
      type: 'reference',
      to: [{type: 'person'}],
    }),
    defineField({
      name: 'externalId',
      title: 'External ID',
      type: 'number',
    }),
    defineField({
      name: 'externalCreditId',
      title: 'External Credit ID',
      type: 'string',
    }),
  ],
  preview: {
    select: {
      name: 'person.name',
      job: 'job',
      department: 'department',
      media: 'person.image',
    },
    prepare(selection) {
      const {name, job, department, media} = selection
      return {
        title: name,
        subtitle: `${job} [${department}]`,
        media,
      }
    },
  },
})
