import {create} from '../mockDocStateDatastore'

function CreateAction(state) {
  if (state.draft || state.published) {
    return null
  }
  return {
    label: 'Create',
    disabled: !!state.draft,
    handle: () => {
      create(state.id, {_type: 'hello'})
    }
  }
}

export default {
  id: 'create',
  group: 'primary',
  action: CreateAction
}
