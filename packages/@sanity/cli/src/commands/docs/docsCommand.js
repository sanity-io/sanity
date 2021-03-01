import open from 'opn'

export default {
  name: 'docs',
  signature: 'docs',
  description: 'Opens the Sanity documentation',
  action(args, context) {
    const {output} = context
    const {print} = output
    const url = 'https://www.sanity.io/docs/content-studio'

    print(`Opening ${url}`)
    open(url, {wait: false})
  },
}
