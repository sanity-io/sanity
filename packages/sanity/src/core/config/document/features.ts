import {type ComponentType} from 'react'

import {type DocumentFeatureContext} from '../types'
import {type DocumentFieldAction} from './fieldActions/types'
import {type DocumentInspector} from './inspector'

/**
 * Every feature name Sanity defines. Exported so config can enumerate the built-ins at runtime, and
 * so a test can assert on the list: the only warning available when an upgrade adds one.
 *
 * @hidden
 * @beta
 */
export const SANITY_DEFINED_FEATURE_NAMES = [
  'titleBar',
  'versionPicker',
  'copyActions',
  'inspect',
  'compareVersions',
  'inlineChanges',
  'productionPreview',
  'copyField',
  'pasteField',
  'history',
  'validation',
  'incomingReferences',
  'splitPane',
  'focusMode',
  'closePane',
  'closePaneGroup',
] as const

/** @hidden @beta */
export type SanityDefinedFeatureName = (typeof SANITY_DEFINED_FEATURE_NAMES)[number]

/** @hidden @beta */
export function isSanityDefinedFeatureName(name: string): name is SanityDefinedFeatureName {
  return (SANITY_DEFINED_FEATURE_NAMES as readonly string[]).includes(name)
}

/**
 * A feature name. Autocompletes the Sanity-defined names and accepts any other string, because a
 * feature registered through `document.inspectors` or `document.unstable_fieldActions` is named by
 * that registration's own `name`, which Sanity does not control.
 *
 * @hidden
 * @beta
 */
export type DocumentFeatureName = SanityDefinedFeatureName | (string & {})

/**
 * A toolbar entry drawn as a button in the header, after the built-ins.
 *
 * @hidden
 * @beta
 */
export interface DocumentFeatureHeaderEntry {
  placement: 'header'
  /**
   * What to draw. Declare it at module scope: the resolver re-runs whenever its inputs change,
   * and a component identity created inside it remounts the button on every run.
   */
  render: ComponentType
}

/**
 * A toolbar entry drawn at the end of the overflow menu. Plain data, so the menu button can tell
 * it has contents. An entry that needs React state or the document's edit state is a document
 * action in the `paneActions` group, not a feature.
 *
 * @hidden
 * @beta
 */
export interface DocumentFeatureMenuEntry {
  placement: 'menu'
  title: string
  icon?: ComponentType
  onAction: () => void
  /** Keyboard shortcut, in `is-hotkey` syntax. Shown on the entry and fired while the pane has focus. */
  shortcut?: string
}

/** @hidden @beta */
export type DocumentFeatureToolbarEntry = DocumentFeatureHeaderEntry | DocumentFeatureMenuEntry

/**
 * A named unit of the document form. Present in the resolved list, everything it carries exists:
 * the inspector is registered and reachable by URL, the field action renders in every field menu
 * and at the document level, the toolbar entry is drawn. Absent, none of it exists.
 *
 * @hidden
 * @beta
 */
export interface DocumentFeature {
  name: DocumentFeatureName
  inspector?: DocumentInspector
  fieldAction?: DocumentFieldAction
  toolbar?: DocumentFeatureToolbarEntry
}

/** @hidden @beta */
export interface DocumentHeaderFeature extends DocumentFeature {
  toolbar: DocumentFeatureHeaderEntry
}

/** @hidden @beta */
export interface DocumentMenuFeature extends DocumentFeature {
  toolbar: DocumentFeatureMenuEntry
}

/** @hidden @beta */
export type DocumentFeaturesResolver = (
  prev: DocumentFeature[],
  context: DocumentFeatureContext,
) => DocumentFeature[]

/**
 * The document form's features, resolved for one document.
 *
 * @hidden
 * @beta
 */
export interface ResolvedDocumentFeatures {
  /** Every resolved feature, in resolver order, duplicate names collapsed to the last one. */
  readonly features: readonly DocumentFeature[]
  readonly byName: ReadonlyMap<string, DocumentFeature>
  /** The inspectors of the resolved features, in feature order. */
  readonly inspectors: DocumentInspector[]
  /** The field actions of the resolved features, in feature order. */
  readonly fieldActions: DocumentFieldAction[]
  /** Features with a header entry, in feature order. */
  readonly header: readonly DocumentHeaderFeature[]
  /** Features with a menu entry, in feature order. */
  readonly menu: readonly DocumentMenuFeature[]
}
