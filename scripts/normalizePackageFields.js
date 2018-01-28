const uniq = require('lodash/uniq')
const transformPkgs = require('./transformPkgs')

const COMMON_KEYWORDS = ['sanity', 'cms', 'headless', 'realtime', 'content']

transformPkgs(pkgManifest => {
  const name = pkgManifest.name.split('/').slice(-1)[0]
  return Object.assign({}, pkgManifest, {
    bugs: {
      url: 'https://github.com/sanity-io/sanity/issues'
    },
    keywords: uniq(
      COMMON_KEYWORDS
        .concat(name)
        .concat(pkgManifest.keywords || [])
    ),
    homepage: 'https://www.sanity.io/',
    license: 'MIT',
    repository: {
      type: 'git',
      url: 'git+https://github.com/sanity-io/sanity.git'
    }
  })
})
