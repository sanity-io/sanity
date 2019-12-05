import {create} from '../mockDocStateDatastore'

export default function CreateAction(docInfo) {
  if (docInfo.draft || docInfo.published) {
    return null
  }
  return {
    label: 'Create',
    handle: () => {
      create(docInfo.id, {_type: 'mock'})
    }
  }
}
