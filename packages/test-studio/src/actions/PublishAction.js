import {publish} from '../mockDocStateDatastore'
import {omit} from 'lodash'

const PublishAction = record => {
  return {
    disabled: !record.draft && !record.published,
    label: 'Publish',
    handle: () => {
      publish(record.id, doc => omit(doc, 'reviewers'))
    }
  }
}

export default {
  id: 'publish',
  group: 'primary',
  action: PublishAction
}
