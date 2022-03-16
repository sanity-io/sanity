// NOTE: the purpose of this mock schema is so modules that require a schema
// can still resolve and run by default. However, if you wish to test a specific
// part of your code, you should not rely on the implementation details of this
// schema and instead mock your own by:
//
// 1. using the `moduleNameMapper` replacing `part:@sanity/base/schema` in the
//    project jest.config.js file or
// 2. mocking per test file using `jest.mock('part:@sanity/base/schema', () => {})`
import createSchema from 'part:@sanity/base/schema-creator'

export default createSchema({
  name: 'mockSchema',
  types: [
    {
      name: 'mockDocumentType',
      title: 'Mock Document',
      type: 'document',
      fields: [{name: 'title', type: 'string'}],
    },
  ],
})
