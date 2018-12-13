function parseSearchQuery(queryStr, opts = {}) {
  const terms = queryStr.split(/\s+/).filter(Boolean)

  return {
    original: queryStr,
    terms,
    groqFilters: []
  }
}

export default parseSearchQuery
