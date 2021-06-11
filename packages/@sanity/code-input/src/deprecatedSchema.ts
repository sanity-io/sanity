export default (() => {
  /* eslint-disable no-console */
  console.warn('@sanity/code-input has been upgraded to automatically register its schema type.')
  console.warn('Please remove the explicit import of `part:@sanity/base/schema-type`')
  /* eslint-enable no-console */

  return {
    name: 'oldDeprecatedCodeTypeWhichYouShouldRemove',
    type: 'object',
    title: 'Deprecated code type',
    fields: [
      {
        title: 'Code',
        name: 'code',
        type: 'text',
      },
    ],
  }
})()
