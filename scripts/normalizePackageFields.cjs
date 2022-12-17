'use strict'

const uniq = require('lodash/uniq')
const transformPkgs = require('./utils/transformPkgs.cjs')

const COMMON_KEYWORDS = ['sanity', 'cms', 'headless', 'realtime', 'content']
const supportedNodeVersionRange = '>=14.0.0'

transformPkgs((pkgManifest) => {
  const name = pkgManifest.name.split('/').slice(-1)[0]

  const engines = pkgManifest.engines
  if (engines && engines.node) {
    engines.node = supportedNodeVersionRange
  }

  return {
    ...pkgManifest,
    engines,
    author: 'Sanity.io <hello@sanity.io>',
    bugs: {
      url: 'https://github.com/sanity-io/sanity/issues',
    },
    keywords: uniq(COMMON_KEYWORDS.concat(name).concat(pkgManifest.keywords || [])),
    homepage: 'https://www.sanity.io/',
    license: 'MIT',
    repository: {
      type: 'git',
      url: 'git+https://github.com/sanity-io/sanity.git',
      directory: `packages/${pkgManifest.name}`,
    },
  }
})
