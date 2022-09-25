const MAX_DATASET_NAME_LENGTH = 64

export function validateDatasetAliasName(datasetName: string): false | string {
  if (!datasetName) {
    return 'Alias name is missing'
  }

  const name = `${datasetName}`

  if (name.toLowerCase() !== name) {
    return 'Alias name must be all lowercase characters'
  }

  if (name.length < 2) {
    return 'Alias name must be at least two characters long'
  }

  if (name.length > MAX_DATASET_NAME_LENGTH) {
    return `Alias name must be at most ${MAX_DATASET_NAME_LENGTH} characters`
  }

  if (!/^[a-z0-9~]/.test(name)) {
    return 'Alias name must start with a letter or a number'
  }

  if (!/^[a-z0-9~][-_a-z0-9]+$/.test(name)) {
    return 'Alias name must only contain letters, numbers, dashes and underscores'
  }

  if (/[-_]$/.test(name)) {
    return 'Alias name must not end with a dash or an underscore'
  }

  return false
}
