import pick from 'lodash-es/pick.js'

import {warnIfPreviewHasFields, warnIfPreviewOnOptions} from './deprecationUtils'
import guessPreviewConfig from './guessPreviewConfig'

function parseSelection(selection: any) {
  return selection.reduce((acc: any, field: any) => {
    acc[field] = field
    return acc
  }, {})
}

function parsePreview(preview: any) {
  if (!preview) {
    return preview
  }
  const select = preview.select || preview.fields || {}
  if (Array.isArray(select)) {
    return {
      ...pick(preview, ['prepare', 'component']),
      select: parseSelection(select),
    }
  }
  return {
    ...pick(preview, ['prepare', 'component']),
    select,
  }
}

const guessedPreviews = new WeakSet<object>()

/**
 * True when the preview was inferred from the type's fields rather than declared by the type
 * definition.
 */
export function isGuessedPreview(preview: unknown): boolean {
  return typeof preview === 'object' && preview !== null && guessedPreviews.has(preview)
}

export default function createPreviewGetter(objectTypeDef: any) {
  return function previewGetter() {
    warnIfPreviewOnOptions(objectTypeDef)
    warnIfPreviewHasFields(objectTypeDef)
    const preview = parsePreview(objectTypeDef.preview || (objectTypeDef.options || {}).preview)
    if (preview) {
      return preview
    }
    const guessed = guessPreviewConfig(objectTypeDef)
    guessedPreviews.add(guessed)
    return guessed
  }
}
