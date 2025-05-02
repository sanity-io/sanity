export function getProjectIdDatasetsOutString(
  projectIdDatasets: {projectId: string; dataset: string}[],
) {
  return projectIdDatasets.length === 1
    ? `${projectIdDatasetPair(projectIdDatasets[0])}`
    : `${getStringArrayOutString(projectIdDatasets.map(projectIdDatasetPair))}`
}

export function projectIdDatasetPair(pair: {projectId: string; dataset: string}) {
  return JSON.stringify({projectId: pair.projectId, dataset: pair.dataset})
}

export function getStringArrayOutString(array: string[]) {
  return `[${array.map((d) => `"${d}"`).join(',')}]`
}

export function getStringList(array: string[]) {
  return array.map((s) => `- ${s}`).join('\n')
}
