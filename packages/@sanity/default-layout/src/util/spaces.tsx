// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import config from 'config:sanity'
import {capitalize} from 'lodash'

const FEATURE_KEY = '__experimental_spaces'

export interface ApiConfig {
  projectId?: string
  dataset?: string
}

function prepareSpace(space) {
  return Object.assign({}, space, {
    title: space.title || capitalize(space.name),
  })
}

function getConfiguredSpaces(): {
  api: ApiConfig
  default: boolean
  name: string
  title: string
}[] {
  if (!config[FEATURE_KEY]) {
    return null
  }

  return config[FEATURE_KEY] && config[FEATURE_KEY].map(prepareSpace)
}

export const CONFIGURED_SPACES = getConfiguredSpaces()
export const HAS_SPACES = CONFIGURED_SPACES && CONFIGURED_SPACES.length > 0
