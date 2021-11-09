import ProteinInput from './ProteinInput'

export default {
  name: 'protein',
  title: 'Protein',
  type: 'object',
  inputComponent: ProteinInput,
  fields: [
    {
      name: 'pdb',
      title: 'PDB',
      type: 'string',
    },
    {
      name: 'Camera',
      title: 'Camera',
      type: 'object',
      fields: [
        {
          name: 'rotation',
          type: 'array',
          of: [{type: 'number'}],
        },
        {
          name: 'center',
          type: 'number',
        },
        {
          name: 'zoom',
          type: 'array',
          of: [{type: 'number'}],
        },
      ],
    },
  ],
}
