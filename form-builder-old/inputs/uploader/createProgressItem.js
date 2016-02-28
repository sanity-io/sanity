export default createProgressItem

function createProgressItem(file) {
  return {
    file: file,
    progress: 0,
    error: null,
    humanErrorMessage: null
  }
}
