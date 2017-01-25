const TITLE_CANDIDATES = ['title', 'name', 'label', 'heading', 'header', 'caption']
const DESCRIPTION_CANDIDATES = ['description', ...TITLE_CANDIDATES]

function defaultPrepare(obj) {
  return obj
}

export default function guessPreviewFields(fields) {

  // Check if we have fields with names that is listed in candidate fields
  let titleField = fields.find(field => TITLE_CANDIDATES.includes(field.name))
  let descField = fields.find(field => field !== titleField && DESCRIPTION_CANDIDATES.includes(field.name))

  if (!titleField) {
    // Pick first defined string field
    titleField = fields.find(field => field.type.name === 'string')
    // Pick next as desc
    descField = fields.find(field => field !== titleField && field.type.name === 'string')
  }

  if (!titleField) {
    // Pick first defined string field
    titleField = fields.find(field => field.type.name === 'string')
    // Pick next as desc
    descField = fields.find(field => field !== titleField && field.type.name === 'string')
  }

  if (!titleField) {
    // last resort, pick all fields and concat them
    const fieldNames = fields.map(field => field.name)
    const fieldMapping = fieldNames.reduce((acc, fieldName) => {
      acc[fieldName] = fieldName
      return acc
    }, {})

    return {
      fields: fieldMapping,
      prepare(data) {
        return {
          title: fieldNames.map(name => `${name}: ${JSON.stringify(data[name])}`).join(' / ')
        }
      }
    }
  }

  const config = {
    fields: {
      title: titleField && titleField.name,
    },
    prepare: defaultPrepare
  }
  if (descField && descField.name) {
    // Only set this if we have found a description field
    config.fields.description = descField.name
  }
  return config
}
