type FieldDef = {
  type: string
  name: string
  of?: {type: string}[]
}

export function isBlockField(field: FieldDef): boolean {
  return field.type === 'array' && field.of && field.of.some((member) => member.type === 'block')
}
