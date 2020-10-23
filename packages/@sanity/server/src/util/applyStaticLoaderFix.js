import {get} from 'lodash'

// In webpack 3 we don't actually need the fix, but keep the API around for compatibility
const applyStaticLoaderFix = (wpConfig) => {
  return get(wpConfig, 'module.rules', [])
}

export default applyStaticLoaderFix
