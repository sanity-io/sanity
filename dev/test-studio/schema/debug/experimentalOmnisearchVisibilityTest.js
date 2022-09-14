/**
 * Documents of this type should never be visible in omnisearch results,
 * nor should they appear in the omnisearch document filter list.
 */
export default {
  // eslint-disable-next-line camelcase
  __experimental_omnisearch_visibility: false,
  type: 'document',
  name: 'experimentalOmnisearchVisibilityTest',
  title: 'Experimental omnisearch visibility test',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: 'Title',
    },
  ],
}
