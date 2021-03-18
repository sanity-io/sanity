const client = {
  fetch: () => Promise.resolve(['book', 'book']),
  withConfig: () => client,
}

module.exports = client
