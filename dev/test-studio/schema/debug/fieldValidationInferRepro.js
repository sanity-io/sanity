export const fieldValidationInferReproSharedObject = {
  type: 'object',
  name: 'someObjectType',
  fields: [
    {name: 'first', type: 'string'},
    {name: 'second', type: 'string'},
  ],
}
export const fieldValidationInferReproDoc = {
  name: 'fieldValidationInferReproDoc',
  type: 'document',
  title: 'FieldValidationRepro',
  fields: [
    {
      name: 'withValidation',
      type: 'someObjectType',
      title: 'Field of someObjectType with validation',
      description: 'First field should be required',
      validation: (Rule) =>
        Rule.fields({
          first: (fieldRule) => fieldRule.required(),
        }),
    },
    {
      name: 'withoutValidation',
      type: 'someObjectType',
      title: 'Field of someObjectType without validation',
      description: 'First field should not be required',
    },
  ],
}
