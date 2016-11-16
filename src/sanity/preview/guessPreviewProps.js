const TITLE_CANDIDATES = ['title', 'name', 'label', 'heading', 'header', 'caption']
const DESCRIPTION_CANDIDATES = ['description', ...TITLE_CANDIDATES]
const MEDIA_CANDIDATES = ['image', 'video']

export default function guessPreviewProps(field) {

  if (!field.fields) {
    return null
  }

  // Check if we have fields with names that is listed in candidate fields
  let titleField = field.fields.find(fieldDef => TITLE_CANDIDATES.includes(fieldDef.name))
  let descField = field.fields.find(fieldDef => fieldDef !== titleField && DESCRIPTION_CANDIDATES.includes(fieldDef.name))

  if (!titleField) {
    // Pick first defined string field
    titleField = field.fields.find(fieldDef => fieldDef.type === 'string')
    // Pick next as desc
    descField = field.fields.find(fieldDef => fieldDef !== titleField && fieldDef.type === 'string')
  }

  const mediaField = field.fields.find(fieldDef => MEDIA_CANDIDATES.includes(fieldDef.name))

  return {
    fields: {
      title: titleField && titleField.name,
      description: descField && descField.name,
      media: mediaField && mediaField.name
    }
  }
}
