const JEST_PROJECTS = [
  'sanity',
  '@sanity/block-tools',
  '@sanity/export',
  '@sanity/import',
  '@sanity/mutator',
  '@sanity/portable-text-editor',
  '@sanity/schema',
  '@sanity/transaction-collator',
  '@sanity/util',
  '@sanity/validation',
]

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  projects: JEST_PROJECTS.map((pkgName) => `<rootDir>/packages/${pkgName}`),
}
