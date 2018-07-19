import {SerializeError} from '@sanity/structure'

export default structure => {
  if (!structure) {
    let val = 'null'
    if (structure !== null) {
      val = typeof structure === 'undefined' ? 'undefined' : 'false'
    }

    throw new SerializeError(`Structure resolved to ${val}`, [], 'root')
  }

  if (!structure.id) {
    throw new SerializeError('Structure did not contain required `id` property', [], 'root')
  }

  if (structure.id === 'edit') {
    throw new SerializeError('The root structure cannot have value `edit` as `id`', [], 'root')
  }
}
