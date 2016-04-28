const joinQueries = queries => {
  const content = Object.keys(queries)
    .map(key => `  "${key}": ${queries[key]}`)
    .join(',\n')

  return `{\n${content}\n}`
}

export default joinQueries
