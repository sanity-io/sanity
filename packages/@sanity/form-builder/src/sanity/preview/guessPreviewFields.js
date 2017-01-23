const TITLE_CANDIDATES = ['title', 'name', 'label', 'heading', 'header', 'caption']
const DESCRIPTION_CANDIDATES = ['description', ...TITLE_CANDIDATES]

export default function guessPreviewFields(typeDef) {

  if (!typeDef.fields) {
    // Uh oh - this can not be a document, right?
    // todo throw?
    return null
  }

  // Check if we have fields with names that is listed in candidate fields
  let titleField = typeDef.fields.find(fieldDef => TITLE_CANDIDATES.includes(fieldDef.name))
  let descField = typeDef.fields.find(fieldDef => fieldDef !== titleField && DESCRIPTION_CANDIDATES.includes(fieldDef.name))

  if (!titleField) {
    // Pick first defined string field
    titleField = typeDef.fields.find(fieldDef => fieldDef.type === 'string')
    // Pick next as desc
    descField = typeDef.fields.find(fieldDef => fieldDef !== titleField && fieldDef.type === 'string')
  }

  return {
    title: titleField && titleField.name,
    description: descField && descField.name
  }
}
