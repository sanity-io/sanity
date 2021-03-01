import config from 'config:sanity'
import {capitalize} from 'lodash'

const FEATURE_KEY = '__experimental_spaces'

function prepareSpace(space) {
  return Object.assign({}, space, {
    title: space.title || capitalize(space.name),
  })
}

function getConfiguredSpaces(): {api: {}; default: boolean; name: string; title: string}[] {
  if (!config[FEATURE_KEY]) {
    return null
  }
  return config[FEATURE_KEY] && config[FEATURE_KEY].map(prepareSpace)
}

export const CONFIGURED_SPACES = getConfiguredSpaces()
export const HAS_SPACES = CONFIGURED_SPACES && CONFIGURED_SPACES.length > 0
