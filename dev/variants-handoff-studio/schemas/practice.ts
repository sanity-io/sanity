import {defineField, defineType} from 'sanity'

// Practice documents for the delete tasks in the review guide (6.1-6.3): numbered sets that reviewers are free to delete, kept in
// their own Structure item so they never show up in the Books lists the test cases use. Seeded by seed/seed-practice.mts.
export const practiceDoc = defineType({
  name: 'practiceDoc',
  title: 'Practice document',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string'}),
    defineField({name: 'note', type: 'text', rows: 2}),
    defineField({name: 'related', title: 'Links to', type: 'reference', to: [{type: 'practiceDoc'}], weak: true}),
  ],
  preview: {select: {title: 'title', subtitle: 'note'}},
})
