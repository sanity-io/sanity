import {pick} from 'lodash'

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

export default function createPreviewGetter(objectTypeDef: any) {
  return function previewGetter() {
    warnIfPreviewOnOptions(objectTypeDef)
    warnIfPreviewHasFields(objectTypeDef)
    const preview = parsePreview(objectTypeDef.preview || (objectTypeDef.options || {}).preview)
    return preview || guessPreviewConfig(objectTypeDef)
  }
}
