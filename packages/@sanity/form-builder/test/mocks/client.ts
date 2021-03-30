export default {
  withConfig() {
    return {
      config() {
        return {}
      },
      getUrl() {
        return 'http://foo.bar'
      },
    }
  },
}
