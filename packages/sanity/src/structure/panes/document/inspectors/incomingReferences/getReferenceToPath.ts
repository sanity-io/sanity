import {type ObjectSchemaType} from 'sanity'

import {isReferenceType} from '../../../../../presentation/overlays/schema/helpers'

export function getReferenceToPath({
  schemaType,
  referenceToType,
}: {
  schemaType: ObjectSchemaType
  referenceToType: string
}): {path: string; typeName: string} | null {
  const referenceToField = schemaType.fields.find((field) => {
    if (isReferenceType(field.type)) {
      return field.type.to.find((toType) => toType.name === referenceToType)
    }
    // TODO: add recursive logic to find the reference to path for nested fields.
    // TODO: handle arrays and PTE
    return false
  })
  if (!referenceToField) {
    return null
  }
  return {
    path: referenceToField.name,
    typeName: referenceToField.type.name,
  }
}
