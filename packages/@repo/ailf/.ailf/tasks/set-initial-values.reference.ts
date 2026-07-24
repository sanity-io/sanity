// @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
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
            initialValue: true,
          }),
          defineField({
            name: 'timezone',
            title: 'Timezone',
            type: 'string',
            initialValue: 'Europe/Oslo',
          }),
          defineField({
            name: 'date',
            title: 'Date',
            type: 'datetime',
            initialValue: () => new Date().toISOString(),
          }),
        ],
      }),
    ],
  },
})
