import {createContext, use} from 'react'

import {type VisionAiConfig, type VisionAiFeatures} from '../types'

/** Every AI feature, each resolved to whether it is on */
export type ResolvedAiFeatures = Required<VisionAiFeatures>

export const ALL_AI_FEATURES: ResolvedAiFeatures = {
  generateQuery: true,
  generateMutations: true,
  explainQuery: true,
}

const NO_AI_FEATURES: ResolvedAiFeatures = {
  generateQuery: false,
  generateMutations: false,
  explainQuery: false,
}

/** The `ai` option as the features it leaves on: a feature is on unless set to `false` */
export function resolveAiFeatures(ai: VisionAiConfig | undefined): ResolvedAiFeatures {
  if (ai === false) return NO_AI_FEATURES
  if (typeof ai !== 'object' || ai === null) return ALL_AI_FEATURES
  return {
    generateQuery: ai.generateQuery !== false,
    generateMutations: ai.generateMutations !== false,
    explainQuery: ai.explainQuery !== false,
  }
}

export const AiFeaturesContext = createContext<ResolvedAiFeatures>(ALL_AI_FEATURES)

export function useAiFeatures(): ResolvedAiFeatures {
  return use(AiFeaturesContext)
}
