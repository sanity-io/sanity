module.exports = (datasetName) => {
  if (!datasetName) {
    return 'Dataset name is missing'
  }

  const name = `${datasetName}`

  if (name.toLowerCase() !== name) {
    return 'Dataset name must be all lowercase characters'
  }

  if (name.length < 2) {
    return 'Dataset name must be at least two characters long'
  }

  if (name.length > 20) {
    return 'Dataset name must be at most 20 characters'
  }

  if (!/^[a-z0-9]/.test(name)) {
    return 'Dataset name must start with a letter or a number'
  }

  if (!/^[a-z0-9][-_a-z0-9]+$/.test(name)) {
    return 'Dataset name must only contain letters, numbers, dashes and underscores'
  }

  if (/[-_]$/.test(name)) {
    return 'Dataset name must not end with a dash or an underscore'
  }

  return false
}
