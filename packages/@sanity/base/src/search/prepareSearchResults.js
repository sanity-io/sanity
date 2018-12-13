function prepareSearchResults(results, query) {
  // This function may be extended by overriding using the part system
  return results.slice(0, 100)
}

export default prepareSearchResults
