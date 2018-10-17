const SanityClient = require('./src/sanityClient')

global.window = {
  location: {hostname: 'prod.com'}
}
// should warn
new SanityClient({projectId: 'skajfie', useCdn: false, token: 'foo'})
