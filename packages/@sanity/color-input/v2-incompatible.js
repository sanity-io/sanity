const {showIncompatiblePluginDialog} = require('@sanity/incompatible-plugin')
const {name, version, sanityExchangeUrl} = require('./package.json')

export default showIncompatiblePluginDialog({
  name: name,
  versions: {
    v3: version,
    v2: '^2.30.0',
  },
  sanityExchangeUrl,
})
