const client = {
  withConfig: () => ({
    fetch: () => Promise.resolve(['book', 'book']),
    withConfig: () => client,
  }),
}

module.exports = client
