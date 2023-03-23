const FIELDS = [...Array(500)].map((_, index) => ({
  name: `manyFieldsTestString${index}`,
  title: `String (${index})`,
  type: 'string',
}))

export default {
  name: 'manyFieldsTest',
  type: 'document',
  title: 'Many fields test',
  description: 'Documents containing a large number of fields',
  fields: FIELDS,
}
