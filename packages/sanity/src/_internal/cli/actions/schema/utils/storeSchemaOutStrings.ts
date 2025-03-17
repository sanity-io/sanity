export function getDatasetsOutString(datasets: string[]) {
  return datasets.length === 1
    ? `dataset "${datasets[0]}"`
    : `datasets ${getStringArrayOutString(datasets)}`
}

export function getStringArrayOutString(array: string[]) {
  return `[${array.map((d) => `"${d}"`).join(',')}]`
}

export function getStringList(array: string[]) {
  return array.map((s) => `- "${s}"`).join('\n')
}
