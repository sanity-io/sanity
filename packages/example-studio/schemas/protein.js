import ProteinInput from '../components/ProteinInput/ProteinInput'

// todo
const XYZ = ['v0', 'v1', 'v2'].map(n => ({
  name: n,
  title: n.toUpperCase(),
  type: 'number'
}))

export default {
  name: 'protein',
  title: 'Protein',
  type: 'document',
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
          type: 'object',
          fields: XYZ
        },
        {
          name: 'center',
          type: 'object',
          fields: XYZ
        },
        {
          name: 'zoom',
          type: 'object',
          fields: XYZ
        }
      ]
    }
  ]
}
