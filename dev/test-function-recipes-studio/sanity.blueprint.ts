import {defineBlueprint, defineDocumentFunction} from '@sanity/blueprints'

export default defineBlueprint({
  resources: [
    // defineDocumentFunction({name: 'my-function'}),
    defineDocumentFunction({
      type: 'sanity.function.document',
      src: '../../examples/functions/first-published',
      name: 'first-published',
      memory: 1,
      timeout: 10,
      event: {
        on: ['create'],
        filter: "_type == 'post' && !defined(firstPublished)",
        projection: '{_id}',
      },
    }),
  ],
})
