export default {
  encode(id) {
    return id.split('/').join('.')
  },
  decode(id) {
    return id.split('.').join('/')
  }
}
