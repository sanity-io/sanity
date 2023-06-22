export default {
  name: 'testInfo',
  title: 'Test details',
  type: 'object',
  options: {
    collapsible: true,
    columns: 2,
  },
  readOnly: true,
  fields: [
    {
      name: 'testName',
      title: 'Test name',
      type: 'string',
    },
    {
      name: 'projectName',
      title: 'Project name',
      type: 'string',
    },
    {
      name: 'testId',
      title: 'Test ID',
      type: 'string',
    },
    {
      name: 'timestamp',
      title: 'Timestamp',
      type: 'string',
    },
    // {
    //   name: 'status',
    //   title: 'Status',
    //   type: 'string',
    // },
  ],
}
