import ProteinInput from '../components/ProteinInput/ProteinInput'

export default {
  name: 'protein',
  title: 'Protein',
  type: 'object',
  inputComponent: ProteinInput,
  fields: [
    {
      name: 'pdb',
      title: 'PDB',
      type: 'string'
    },
    {
      name: 'Camera',
      title: 'Camera',
      type: 'object',
      fields: [
        {
          name: 'rotation',
          type: 'object'
        },
        {
          name: 'center',
          type: 'object'
        },
        {
          name: 'zoom',
          type: 'object'
        }
      ]
    }
  ]
}
