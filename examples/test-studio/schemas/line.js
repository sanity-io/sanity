export default {
  name: 'line',
  title: 'Line',
  type: 'object',

  fields: [
    {name: 'line1', type: 'string', title: 'Line 1'},
    {name: 'line2', type: 'string', title: 'Line 2'},
  ],

  initialValue: () => ({
    line1: 'one line',
    line2: 'second line',
  }),
}
