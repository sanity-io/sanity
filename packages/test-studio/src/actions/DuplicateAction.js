import {duplicate} from '../mockDocStateDatastore'
import {navigate} from '../test-action-tool/TestActionsTool'
import {omit} from 'lodash'

const DuplicateAction = record => {
  return {
    disabled: !record.draft && !record.published,
    label: 'Duplicate',
    handle: () => {
      const dupeId = `duped-${record.id}`
      duplicate(record.id, dupeId, current => omit(current, ['reviewers']))
      navigate(dupeId)
    }
  }
}

export default {
  id: 'duplicate',
  group: 'primary',
  action: DuplicateAction
}
