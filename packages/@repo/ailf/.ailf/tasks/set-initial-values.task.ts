import {defineTask} from '@sanity/ailf'

export default defineTask({
  mode: 'literacy',
  id: 'set-initial-values',
  title: 'Set initial values',
  area: 'studio',
  context: {
    docs: [
      {
        path: 'studio/initial-value-templates',
      },
    ],
  },
  docCoverage: true,
  referenceSolution: 'tasks/set-initial-values.reference.ts',
  prompt: {
    text: `When editors create a new event, the "Doors open" toggle should
default to on and the timezone should default to "Europe/Oslo". New events
should also default their date to the moment they are created.

This is the existing Studio configuration:

\`\`\`ts
import {defineConfig, defineType, defineField} from 'sanity'

export default defineConfig({
  name: 'default',
  title: 'Events',
  projectId: 'xxxxxxxx',
  dataset: 'production',
  schema: {
    types: [
      defineType({
        name: 'event',
        title: 'Event',
        type: 'document',
        fields: [
          defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
          }),
          defineField({
            name: 'doorsOpen',
            title: 'Doors open',
            type: 'boolean',
          }),
          defineField({
            name: 'timezone',
            title: 'Timezone',
            type: 'string',
          }),
          defineField({
            name: 'date',
            title: 'Date',
            type: 'datetime',
          }),
        ],
      }),
    ],
  },
})
\`\`\``,
  },
  assertions: [
    {
      type: 'llm-rubric',
      template: 'task-completion',
      criteria: [
        {
          id: 'doors-open-defaults-true',
          text: 'The `event.doorsOpen` field has an initial value of `true`.',
        },
        {
          id: 'timezone-defaults-oslo',
          text: 'The `event.timezone` field has an initial value of "Europe/Oslo".',
        },
        {
          id: 'date-defaults-to-now',
          text: 'The `event.date` field has an initial value computed at creation time (a function returning the current timestamp), not a hardcoded date string.',
        },
        {
          id: 'exports-studio-configuration',
          text: 'Exports a valid Studio configuration.',
        },
      ],
    },
  ],
})
