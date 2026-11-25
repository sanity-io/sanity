import uniq from 'lodash-es/uniq.js'

import {type PackageManifest} from './types'
import transformPkgs from './utils/transformPkgs'

const COMMON_KEYWORDS = ['sanity', 'cms', 'headless', 'realtime', 'content']
// 24.11.0 is the first LTS release of Node 24:
// https://github.com/nodejs/node/blob/main/doc/changelogs/CHANGELOG_V24.md#24.11.0
const supportedNodeVersionRange = '>=24.11'
// The browser support of Studio v7, fixed for the life of the major (the next major picks a new
// Baseline year). See "Browser support" in packages/sanity/README.md
const supportedBrowsers = 'baseline 2026 with downstream'

transformPkgs((pkgManifest: PackageManifest, {relativeDir}) => {
  const name = pkgManifest.name.split('/').slice(-1)[0]

  // Published packages must declare engines.node so publint does not warn and consumers
  // do not install on unsupported Node. Leave private packages' engines untouched;
  // they are kept in step with this range by hand.
  const engines = pkgManifest.private
    ? pkgManifest.engines
    : {...pkgManifest.engines, node: supportedNodeVersionRange}
  // Published packages run in both Node.js and browsers. The build reads this field for the CSS
  // lowering targets (@repo/browser-targets), and so can tooling in a consumer's own build
  const browserslist = pkgManifest.private
    ? pkgManifest.browserslist
    : [`node ${supportedNodeVersionRange}`, supportedBrowsers]

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
    browserslist,
    author: 'Sanity.io <hello@sanity.io>',
    license: 'MIT',
    ...(pkgManifest.private ? {} : publishedFields),
  }
})
