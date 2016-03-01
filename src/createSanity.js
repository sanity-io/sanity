function createSanity({roles}) {
  return {
    getRole(roleName) {
      return roles[roleName]
    }
  }
}

export default createSanity
