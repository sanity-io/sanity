export default {
  name: 'check',
  signature: '',
  description: '[deprecated]',
  hideFromHelp: true,
  action: (args, context) => {
    const {output} = context
    output.print('`sanity check` is deprecated and no longer has any effect')
  },
}
