export default {
  dataset: name => {
    if (!/^[-\w]{1,128}$/.test(name)) {
      throw new Error('Datasets can only contain lowercase characters, numbers, underscores and dashes')
    }
  }
}
