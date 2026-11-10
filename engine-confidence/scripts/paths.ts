import path from 'node:path'

export const engineConfidenceDirectory = path.resolve(import.meta.dirname, '..')
export const repositoryRoot = path.resolve(engineConfidenceDirectory, '..')
export const reportsDirectory = path.join(engineConfidenceDirectory, 'reports')
export const strykerReportsDirectory = path.join(reportsDirectory, 'stryker')
export const catalogueReportsDirectory = path.join(reportsDirectory, 'catalogue')
export const catalogueDirectory = path.join(engineConfidenceDirectory, 'catalogue')
export const defaultRunDocumentPath = path.join(reportsDirectory, 'engine-confidence-run.json')
