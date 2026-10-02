import {
  type DocumentFeature,
  type DocumentFieldAction,
  type DocumentHeaderFeature,
  type DocumentInspector,
  type DocumentMenuFeature,
  type ResolvedDocumentFeatures,
} from 'sanity'

/**
 * Mirrors `SANITY_DEFINED_FEATURES`, which is `@internal` to `core/config/document` and is exported
 * from no entry point, so tests outside `core` have no other source for the seed.
 */
export const SEEDED_FEATURES: readonly DocumentFeature[] = [
  {name: 'titleBar'},
  {name: 'versionPicker'},
  {name: 'copyActions'},
  {name: 'inspect'},
  {name: 'compareVersions'},
  {name: 'inlineChanges'},
  {name: 'productionPreview'},
]

interface BuildResolvedFeaturesOptions {
  /** Names the config resolver filtered out of `prev`. */
  without?: readonly string[]
  /** Header features, in the order the resolver left them. */
  header?: readonly DocumentHeaderFeature[]
  /** Menu features, in the order the resolver left them. */
  menu?: readonly DocumentMenuFeature[]
  /** Inspectors contributed by features the resolver kept. */
  inspectors?: readonly DocumentInspector[]
  /** Field actions contributed by features the resolver kept. */
  fieldActions?: readonly DocumentFieldAction[]
}

/**
 * A `ResolvedDocumentFeatures` shaped the way `resolveDocumentFeatures` shapes one, so a test
 * states only what its case changes.
 */
export function buildResolvedFeatures(
  options: BuildResolvedFeaturesOptions = {},
): ResolvedDocumentFeatures {
  const {without = [], header = [], menu = [], inspectors = [], fieldActions = []} = options
  const removed = new Set(without)

  function isKept({name}: {name: string}): boolean {
    return !removed.has(name)
  }

  const builtIns = SEEDED_FEATURES.filter(isKept)
  const headerFeatures = header.filter(isKept)
  const menuFeatures = menu.filter(isKept)
  const inspectorFeatures: readonly DocumentFeature[] = inspectors
    .filter(isKept)
    .map((inspector) => ({name: inspector.name, inspector}))
  const fieldActionFeatures: readonly DocumentFeature[] = fieldActions
    .filter(isKept)
    .map((fieldAction) => ({name: fieldAction.name, fieldAction}))

  const features = [
    ...builtIns,
    ...headerFeatures,
    ...menuFeatures,
    ...inspectorFeatures,
    ...fieldActionFeatures,
  ]

  return {
    features,
    byName: new Map(features.map((feature) => [feature.name, feature])),
    inspectors: features.flatMap((feature) => (feature.inspector ? [feature.inspector] : [])),
    fieldActions: features.flatMap((feature) => (feature.fieldAction ? [feature.fieldAction] : [])),
    header: headerFeatures,
    menu: menuFeatures,
  }
}

/** A `ResolvedDocumentFeatures` with nothing in it: every gate off, nothing contributed. */
export const EMPTY_FEATURES: ResolvedDocumentFeatures = Object.freeze({
  features: [],
  byName: new Map(),
  inspectors: [],
  fieldActions: [],
  header: [],
  menu: [],
})
