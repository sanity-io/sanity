const {get} = require('lodash')
const {extractWithPath} = require('@sanity/mutator')

module.exports = async function validateCdrDatasets(docs, options) {
  const datasets = getDatasetsFromCrossDatasetReferences(docs)
  if (datasets.length === 0) {
    return
  }

  const {client} = options
  const existing = (await client.datasets.list()).map((dataset) => dataset.name)
  const missing = datasets.filter((dataset) => !existing.includes(dataset))

  if (missing.length > 1) {
    throw new Error(
      [
        `The data to be imported contains one or more cross-dataset references, which refers to datasets that do not exist in the target project.`,
        `Missing datasets: ${missing.map((ds) => `"${ds}"`).join(', ')}`,
        'Either create these datasets in the given project, or use the `skipCrossDatasetReferences` option to skip these references.',
      ].join('\n')
    )
  }

  if (missing.length === 1) {
    throw new Error(
      [
        `The data to be imported contains one or more cross-dataset references, which refers to a dataset that do not exist in the target project.`,
        `Missing dataset: "${missing[0]}"`,
        'Either create this dataset in the given project, or use the `skipCrossDatasetReferences` option to skip these references.',
      ].join('\n')
    )
  }
}

function getDatasetsFromCrossDatasetReferences(docs) {
  const datasets = new Set()
  for (const doc of docs) {
    findCrossCdr(doc, datasets)
  }

  return Array.from(datasets)
}

function findCrossCdr(doc, set) {
  return extractWithPath('..[_ref]', doc)
    .map((match) => get(doc, match.path.slice(0, -1)))
    .filter((ref) => typeof ref._dataset === 'string')
    .reduce((datasets, ref) => datasets.add(ref._dataset), set)
}
