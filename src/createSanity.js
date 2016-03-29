import {PropTypes} from 'react'
import {getUnfulfilledRoleComponent} from './components/UnfulfilledRole'

function Sanity({roles}) {
  function getRole(roleName) {
    const fulfiller = roles[roleName]
    if (!fulfiller) {
      return null
    }

    return Array.isArray(fulfiller)
      ? fulfiller.map(getModule)
      : getModule(fulfiller)
  }

  function getComponents(wanted) {
    return Object.keys(wanted).reduce((target, key) => {
      const role = typeof wanted[key] === 'string'
        ? {name: wanted[key]}
        : wanted[key]

      target[key] = getRole(role.name) || getUnfulfilledRoleComponent(role)

      return target
    }, {})
  }

  function getPluginForRole(roleName) {
    return roles[roleName] && roles[roleName].plugin
  }

  return {
    getRole,
    getComponents,
    getPluginForRole
  }
}

function getModule(fulfiller) {
  return fulfiller.module.__esModule && fulfiller.module.default
    ? fulfiller.module.default
    : fulfiller.module
}

export const sanityShape = {
  sanity: PropTypes.shape({
    getRole: PropTypes.func.isRequired,
    getComponents: PropTypes.func.isRequired,
    getPluginForRole: PropTypes.func.isRequired
  })
}

export default Sanity
