import {commentsModule} from './comments'
import {type FeatureModule} from './types'

export {type FeatureModule} from './types'

export const FEATURE_MODULES: FeatureModule[] = [commentsModule]

export function resolveActiveModules(names: string[]): FeatureModule[] {
  return names.map((name) => {
    const featureModule = FEATURE_MODULES.find((candidate) => candidate.name === name)
    if (!featureModule) {
      throw new Error(
        `Unknown feature module "${name}". Available: ${FEATURE_MODULES.map(
          (candidate) => candidate.name,
        ).join(', ')}`,
      )
    }
    return featureModule
  })
}
