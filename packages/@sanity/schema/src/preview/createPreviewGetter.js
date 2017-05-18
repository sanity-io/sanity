import {pick} from 'lodash'
import guessPreviewConfig from './guessPreviewConfig'
import {warnIfPreviewOnOptions, warnIfPreviewHasFields} from './deprecationUtils'


function parseSelection(selection) {
  return selection.reduce((acc, field) => {
    acc[field] = field
    return acc
  }, {})
}


function parsePreview(preview) {
  if (!preview) {
    return preview
  }
  const select = preview.select || preview.fields
  if (Array.isArray(select)) {
    return {
      ...pick(preview, ['prepare', 'component']),
      select: parseSelection(select)
    }

  }
  return {
    ...pick(preview, ['prepare', 'component']),
    select
  }
}

export default function createPreviewGetter(typeDef, parsed) {
  return function previewGetter() {
    warnIfPreviewOnOptions(typeDef)
    warnIfPreviewHasFields(typeDef)
    const preview = parsePreview(typeDef.preview || (typeDef.options || {}).preview)
    return preview || guessPreviewConfig(parsed.fields)
  }
}
