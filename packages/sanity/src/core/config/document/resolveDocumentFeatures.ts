import {isDev} from '../../environment'
import {type DocumentPluginOptions} from '../types'
import {
  type DocumentFeature,
  type DocumentHeaderFeature,
  type DocumentMenuFeature,
  type ResolvedDocumentFeatures,
} from './features'
import {type DocumentFieldAction} from './fieldActions/types'
import {type DocumentInspector} from './inspector'

/**
 * The features the document form draws itself, at a fixed site, reading their presence from the
 * resolution.
 *
 * A strict subset of `SANITY_DEFINED_FEATURE_NAMES`: the other nine names arrive as registrations
 * (two seeded field actions, structure's three inspectors) or as host contributions (structure's
 * four buttons), so that Presentation and standalone embeddings do not resolve them as present.
 *
 * @internal
 */
export const SANITY_DEFINED_FEATURES: readonly DocumentFeature[] = [
  {name: 'titleBar'},
  {name: 'versionPicker'},
  {name: 'copyActions'},
  {name: 'inspect'},
  {name: 'compareVersions'},
  {name: 'inlineChanges'},
  {name: 'productionPreview'},
]

/** @internal */
export function appendUnique<TItem>(prev: TItem[], next: TItem[]): TItem[] {
  const added = next.filter((item, index) => !prev.includes(item) && next.indexOf(item) === index)
  return added.length === 0 ? prev : [...prev, ...added]
}

/** @internal */
export interface DocumentFeatureRegistrations {
  inspectors: readonly DocumentInspector[]
  fieldActions: readonly DocumentFieldAction[]
}

/**
 * The inspectors or field actions a node declares through the array form of `document.features`,
 * for the flat `inspectors` and `unstable_fieldActions` chains to resolve alongside their own.
 *
 * @internal
 */
export function declaredRegistrations<TKey extends 'inspector' | 'fieldAction'>(
  document: DocumentPluginOptions | undefined,
  key: TKey,
): NonNullable<DocumentFeature[TKey]>[] {
  const declared = document?.features
  if (!Array.isArray(declared)) return []

  return declared.flatMap((feature) => {
    const registration = feature[key]
    return registration ? [registration] : []
  })
}

/** @internal */
export interface SeedDocumentFeaturesOptions extends DocumentFeatureRegistrations {
  /** Every array-form `document.features` entry in the config tree, in flatten order. */
  declared: readonly DocumentFeature[]
  /** What the host offers at render time, after its own capability gating. */
  contributed: readonly DocumentFeature[]
}

function ownersByRegistration(
  declared: readonly DocumentFeature[],
): ReadonlyMap<object, DocumentFeature> {
  const owners = new Map<object, DocumentFeature>()

  declared.forEach((feature) => {
    const registrations = [feature.inspector, feature.fieldAction]
    registrations.forEach((registration) => {
      if (registration && !owners.has(registration)) owners.set(registration, feature)
    })
  })

  return owners
}

/**
 * Builds the list the `document.features` chain starts from: the form-drawn built-ins, the host's
 * contributions, then one feature per registration the flat `inspectors` and
 * `unstable_fieldActions` chains resolved: the declaring feature where one declared it, an
 * auto-named feature otherwise. A feature appears once, at its first occurrence.
 *
 * @internal
 */
export function seedDocumentFeatures({
  inspectors,
  fieldActions,
  declared,
  contributed,
}: SeedDocumentFeaturesOptions): DocumentFeature[] {
  const owners = ownersByRegistration(declared)

  const fromRegistrations = [
    ...inspectors.map((inspector) => owners.get(inspector) ?? {name: inspector.name, inspector}),
    ...fieldActions.map(
      (fieldAction) => owners.get(fieldAction) ?? {name: fieldAction.name, fieldAction},
    ),
  ]

  return appendUnique([...SANITY_DEFINED_FEATURES, ...contributed], fromRegistrations)
}

function retain<TItem>(item: TItem | undefined, registered: readonly TItem[]): TItem | undefined {
  return item && registered.includes(item) ? item : undefined
}

/**
 * Drops a declared feature's `inspector` or `fieldAction` when the flat chains did not resolve it,
 * and drops the feature itself when that leaves it with nothing to bring.
 *
 * @internal
 */
export function stripToRegistered(
  feature: DocumentFeature,
  {inspectors, fieldActions}: DocumentFeatureRegistrations,
): DocumentFeature | undefined {
  const inspector = retain(feature.inspector, inspectors)
  const fieldAction = retain(feature.fieldAction, fieldActions)

  if (inspector === feature.inspector && fieldAction === feature.fieldAction) return feature
  if (inspector || fieldAction || feature.toolbar) return {...feature, inspector, fieldAction}
  return undefined
}

function isHeaderFeature(feature: DocumentFeature): feature is DocumentHeaderFeature {
  return feature.toolbar?.placement === 'header'
}

function isMenuFeature(feature: DocumentFeature): feature is DocumentMenuFeature {
  return feature.toolbar?.placement === 'menu'
}

function warnAboutDuplicates(duplicated: readonly DocumentFeature[]): void {
  const names = [...new Set(duplicated.map((feature) => feature.name))]
  if (names.length === 0) return

  console.warn(
    `\`document.features\` resolved more than one feature with the name ${names
      .map((name) => `\`${name}\``)
      .join(', ')}. The last one wins.`,
  )
}

/**
 * Collapses duplicate names to the last entry, in the last position, and projects the resolved
 * features for the pane: the inspectors and field actions they carry, and the toolbar entries
 * partitioned by placement.
 *
 * @internal
 */
export function finalizeDocumentFeatures(
  features: readonly DocumentFeature[],
): ResolvedDocumentFeatures {
  const lastIndexByName = new Map(features.map((feature, index) => [feature.name, index]))
  const winning = features.filter((feature, index) => lastIndexByName.get(feature.name) === index)

  if (isDev) {
    warnAboutDuplicates(
      features.filter((feature, index) => lastIndexByName.get(feature.name) !== index),
    )
  }

  return {
    features: winning,
    byName: new Map(winning.map((feature) => [feature.name, feature])),
    inspectors: winning.flatMap((feature) => (feature.inspector ? [feature.inspector] : [])),
    fieldActions: winning.flatMap((feature) => (feature.fieldAction ? [feature.fieldAction] : [])),
    header: winning.filter(isHeaderFeature),
    menu: winning.filter(isMenuFeature),
  }
}
