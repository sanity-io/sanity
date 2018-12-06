const path = require('path')
const fse = require('fs-extra')
const addCorsOrigin = require('../../actions/cors/addCorsOrigin')

const helpText = `
Examples
  sanity cors add
  sanity cors add http://localhost:3000
`

export default {
  name: 'add',
  group: 'cors',
  signature: '[ORIGIN]',
  helpText,
  description: 'Allow a new origin to use your project API through CORS',
  action: async (args, context) => {
    const {output} = context
    const [origin] = args.argsWithoutOptions
    const isFile = await fse.pathExists(path.join(process.cwd(), origin))
    if (isFile) {
      output.warn(`Origin "${origin}?" Remember to quote values (sanity cors add "*")`)
    }

    const success = await addCorsOrigin(origin, context)
    if (success) {
      output.print('CORS origin added successfully')
    }
  }
}
