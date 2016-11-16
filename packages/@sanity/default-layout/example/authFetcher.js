export default {
  logout() {
    return Promise.resolve()
  },
  getCurrentUser() {
    return Promise.resolve({
      name: 'Catty Mc. Catface',
      profileImage: 'https://placekitten.com/100/100'
    })
  }
}
