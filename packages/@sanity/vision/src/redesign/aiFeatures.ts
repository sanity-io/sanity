import {createContext, use} from 'react'

import {type VisionAiConfig, type VisionAiFeatures} from '../types'
import {type VisionAiSettings} from './store/types'

/** Every AI feature, each resolved to whether it is on */
export type ResolvedAiFeatures = Required<VisionAiFeatures>

export type AiFeature = keyof ResolvedAiFeatures

/** In the order the settings list them */
export const AI_FEATURE_KEYS: readonly AiFeature[] = [
  'generateQuery',
  'editQuery',
  'fixLint',
  'generateMutations',
  'explainQuery',
]

export const ALL_AI_FEATURES: ResolvedAiFeatures = {
  generateQuery: true,
  editQuery: true,
  fixLint: true,
  generateMutations: true,
  explainQuery: true,
}

const NO_AI_FEATURES: ResolvedAiFeatures = {
  generateQuery: false,
  editQuery: false,
  fixLint: false,
  generateMutations: false,
  explainQuery: false,
}

/** The `ai` option as the features it leaves on: a feature is on unless set to `false` */
export function resolveAiFeatures(ai: VisionAiConfig | undefined): ResolvedAiFeatures {
  if (ai === false) return NO_AI_FEATURES
  if (typeof ai !== 'object' || ai === null) return ALL_AI_FEATURES
  return {
    generateQuery: ai.generateQuery !== false,
    editQuery: ai.editQuery !== false,
    fixLint: ai.fixLint !== false,
    generateMutations: ai.generateMutations !== false,
    explainQuery: ai.explainQuery !== false,
  }
}

/**
 * The features that end up on: those the config leaves on and the user's settings keep on. The
 * settings only switch features off, so a feature the config turns off stays off.
 */
export function resolveEffectiveAiFeatures(
  configured: ResolvedAiFeatures,
  settings: VisionAiSettings,
): ResolvedAiFeatures {
  if (!settings.enabled) return NO_AI_FEATURES
  return {
    generateQuery: configured.generateQuery && settings.generateQuery,
    editQuery: configured.editQuery && settings.editQuery,
    fixLint: configured.fixLint && settings.fixLint,
    generateMutations: configured.generateMutations && settings.generateMutations,
    explainQuery: configured.explainQuery && settings.explainQuery,
  }
}

/** The features in effect, after the config and the user's settings */
export const AiFeaturesContext = createContext<ResolvedAiFeatures>(ALL_AI_FEATURES)

export function useAiFeatures(): ResolvedAiFeatures {
  return use(AiFeaturesContext)
}

/** The features the config leaves on, which the user's settings can switch off */
export const ConfiguredAiFeaturesContext = createContext<ResolvedAiFeatures>(ALL_AI_FEATURES)

export function useConfiguredAiFeatures(): ResolvedAiFeatures {
  return use(ConfiguredAiFeaturesContext)
}
