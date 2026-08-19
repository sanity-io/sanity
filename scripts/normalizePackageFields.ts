import uniq from 'lodash-es/uniq.js'

import {type PackageManifest} from './types'
import transformPkgs from './utils/transformPkgs'

const COMMON_KEYWORDS = ['sanity', 'cms', 'headless', 'realtime', 'content']
const supportedNodeVersionRange = '>=22.12'

transformPkgs((pkgManifest: PackageManifest, {relativeDir}) => {
  const name = pkgManifest.name.split('/').slice(-1)[0]

  // Published packages must declare engines.node so publint does not warn and consumers
  // do not install on unsupported Node. Leave private packages' engines untouched
  // (some, e.g. @repo/debug-proxy, pin a tighter range).
  const engines = pkgManifest.private
    ? pkgManifest.engines
    : {...pkgManifest.engines, node: supportedNodeVersionRange}

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
