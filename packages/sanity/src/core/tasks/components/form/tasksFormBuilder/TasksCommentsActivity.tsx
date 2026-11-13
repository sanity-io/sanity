import {Card} from '@sanity/ui'

import {CommentsProvider} from '../../../../comments-v2/context/comments/CommentsProvider'
import {CommentsProvider as CommentsProviderLegacy} from '../../../../comments/context/comments/CommentsProvider'
import {type ObjectInputProps} from '../../../../form/types/inputProps'
import {useWorkspace} from '../../../../studio/workspace'
import {getPublishedId} from '../../../../util/draftUtils'
import {type useActivityLog} from '../../../hooks/useActivityLog'
import {type TaskDocument} from '../../../types'
import {TasksActivityLog} from '../../activity/TasksActivityLog'

interface TasksCommentsActivityProps {
  value: TaskDocument
  onChange: ObjectInputProps['onChange']
  activityData: ReturnType<typeof useActivityLog>['changes']
}

/**
 * Activity log, in the comments context that the task's comments are read from
 * and written to.
 */
export function TasksCommentsActivity(props: TasksCommentsActivityProps) {
  const {value, onChange, activityData} = props
  const {comments} = useWorkspace()
  const taskId = value._id

  const activityLog = (
    <Card borderTop paddingTop={4} marginTop={4} paddingBottom={6}>
      <TasksActivityLog
        value={value}
        onChange={onChange}
        path={['subscribers']}
        activityData={activityData}
      />
    </Card>
  )

  if (comments.legacy) {
    return (
      <CommentsProviderLegacy
        documentId={taskId}
        documentType="tasks.task"
        sortOrder="asc"
        type="task"
      >
        {activityLog}
      </CommentsProviderLegacy>
    )
  }

  return (
    <CommentsProvider
      groupId={getPublishedId(taskId)}
      versionId={taskId}
      documentType="tasks.task"
      sortOrder="asc"
      type="task"
    >
      {activityLog}
    </CommentsProvider>
  )
}
