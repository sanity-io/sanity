import {create} from '../mockDocStateDatastore'

function useCreate(record) {
  if (record.draft || record.published) {
    return null
  }
  return {
    label: 'Create',
    disabled: !!record.draft,
    handle: () => {
      create(record.id, {_type: 'hello'})
    }
  }
}

export default {
  id: 'create',
  group: 'primary',
  use: useCreate
}
