import uniq from 'lodash/uniq'
import {PackageManifest} from './types'

import transformPkgs from './utils/transformPkgs'

const COMMON_KEYWORDS = ['sanity', 'cms', 'headless', 'realtime', 'content']
const supportedNodeVersionRange = '>=14.18.0'

transformPkgs((pkgManifest: PackageManifest, {relativeDir}) => {
  const name = pkgManifest.name.split('/').slice(-1)[0]

  const engines = pkgManifest.engines
  if (engines && engines.node) {
    engines.node = supportedNodeVersionRange
  }

  const publishedFields = {
    bugs: {
      url: 'https://github.com/sanity-io/sanity/issues',
    },
    keywords: uniq(COMMON_KEYWORDS.concat(name).concat(pkgManifest.keywords || [])),
    homepage: 'https://www.sanity.io/',
    repository: {
      type: 'git',
      url: 'git+https://github.com/sanity-io/sanity.git',
      directory: `packages/${pkgManifest.name}`,
    },
  }

  return {
    ...pkgManifest,
    engines,
    author: 'Sanity.io <hello@sanity.io>',
    license: 'MIT',
    ...(pkgManifest.private ? {} : publishedFields),
  }
})
