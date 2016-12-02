export default {
  logout() {
    return Promise.resolve()
  },
  getCurrentUser() {
    return Promise.resolve({
      name: 'Catty Mc. Catface',
      profileImage: 'https://api.adorable.io/avatars/100/abott@adorable.io.png'
    })
  }
}
