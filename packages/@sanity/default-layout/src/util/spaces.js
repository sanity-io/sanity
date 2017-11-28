import config from 'config:sanity'
import {capitalize} from 'lodash'

const FEATURE_KEY = '__experimental_spaces'

export const CONFIGURED_SPACES = getConfiguredSpaces()
export const HAS_SPACES = CONFIGURED_SPACES && CONFIGURED_SPACES.length > 0

function getConfiguredSpaces() {
  if (!config[FEATURE_KEY]) {
    return null
  }
  return config[FEATURE_KEY] && config[FEATURE_KEY].map(prepareSpace)
}

function prepareSpace(space) {
  return Object.assign({}, space, {
    title: space.title || capitalize(space.name)
  })
}
