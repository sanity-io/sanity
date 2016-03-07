function createSanity({roles}) {
  return {
    getRole(roleName) {
      const fulfiller = roles[roleName]
      if (!fulfiller) {
        return null
      }

      return fulfiller.module.__esModule && fulfiller.module.default
        ? fulfiller.module.default
        : fulfiller.module
    },

    getPluginForRole(roleName) {
      return roles[roleName] && roles[roleName].plugin
    }
  }
}

export default createSanity
