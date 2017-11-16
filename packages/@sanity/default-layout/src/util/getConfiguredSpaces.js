import config from 'config:sanity'
import {capitalize} from 'lodash'

function prepareSpace(space) {
  return Object.assign({}, space, {
    title: space.title || space.name
  })
}

export default function getConfiguredSpaces() {
  if (!config.spaces) {
    const apiConfig = config.api
    return [{name: apiConfig.dataset, title: capitalize(apiConfig.dataset), api: apiConfig}]
  }
  return config.spaces && config.spaces.map(prepareSpace)
}
