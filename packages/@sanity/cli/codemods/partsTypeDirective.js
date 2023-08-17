const path = require('path')
partsTypeDirective.parser = 'tsx'
module.exports = partsTypeDirective

const EXTS = ['.ts', '.tsx']

function partsTypeDirective(fileInfo, api) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  if (!EXTS.includes(path.extname(fileInfo.path))) {
    return fileInfo.source
  }
  const partImports = root.find(api.jscodeshift.ImportDeclaration, (node) =>
    // eslint-disable-next-line no-use-before-define
    isSanityPart(node.source.value),
  )
  if (partImports.length === 0) {
    return fileInfo.source
  }

  const existingDirectives = root.find(api.jscodeshift.Comment, (node) =>
    // eslint-disable-next-line no-use-before-define
    isSanityTypesReferenceDirective(node),
  )
  if (existingDirectives.length > 0) {
    // already added
    return fileInfo.source
  }

  return `// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

${fileInfo.source}`
}

const partMatcher = /^(all:)?part:[@A-Za-z0-9_-]+\/[A-Za-z0-9_/-]+/
const configMatcher = /^config:(@?[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+|[A-Za-z0-9_-]+)$/
const sanityMatcher = /^sanity:/

const isSanityPart = (importPath) =>
  [partMatcher, configMatcher, sanityMatcher].some((match) => match.test(importPath))

const isSanityTypesReferenceDirective = (node) =>
  node.type === 'CommentLine' &&
  // note: the leading '/' is intentional (it's a triple-slash directive)
  node.value === '/<reference types="@sanity/types/parts" />'
