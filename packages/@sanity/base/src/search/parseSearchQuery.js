function parseSearchQuery(queryStr) {
  const terms = queryStr.split(/\s+/).filter(Boolean)

  return {
    original: queryStr,
    terms,
    groqFilters: [],
    limit: 1000
  }
}

export default parseSearchQuery
