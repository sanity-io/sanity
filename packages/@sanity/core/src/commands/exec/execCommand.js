import lazyRequire from '@sanity/util/lib/lazyRequire'

const helpText = `
Options
  --with-user-token

Examples
  # Run the script at some/script.js in Sanity context
  sanity exec some/script.js

  # Run the script at migrations/fullname.js and configure \`part:@sanity/base/client\`
  # to include the current users token
  sanity exec migrations/fullname.js --with-user-token
`

export default {
  name: 'exec',
  signature: 'SCRIPT',
  description: 'Runs a script in Sanity context',
  helpText,
  action: lazyRequire(require.resolve('../../actions/exec/execScript')),
}
