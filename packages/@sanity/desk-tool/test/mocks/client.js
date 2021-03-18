module.exports = {
  withConfig: () => ({
    fetch: () => Promise.resolve(['book', 'book']),
  }),
}
