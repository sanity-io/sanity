const JEST_PROJECTS = [
  '@sanity/base',
  '@sanity/block-tools',
  '@sanity/desk-tool',
  '@sanity/export',
  '@sanity/form-builder',
  '@sanity/imagetool',
  '@sanity/import',
  '@sanity/initial-value-templates',
  '@sanity/mutator',
  '@sanity/portable-text-editor',
  '@sanity/react-hooks',
  '@sanity/schema',
  '@sanity/state-router',
  '@sanity/structure',
  '@sanity/transaction-collator',
  '@sanity/util',
  '@sanity/validation',
  '@sanity/resolver',
  '@sanity/webpack-integration',
]

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  projects: JEST_PROJECTS.map((pkgName) => `<rootDir>/packages/${pkgName}`),
}
