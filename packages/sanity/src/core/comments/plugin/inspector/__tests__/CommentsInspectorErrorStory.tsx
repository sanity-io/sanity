import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {CommentsInspectorError} from '../CommentsInspectorError'

const SCHEMA_TYPES: [] = []

interface CommentsInspectorErrorStoryProps {
  error?: Error
}

export function CommentsInspectorErrorStory({
  error = new Error('Failed to load comments'),
}: CommentsInspectorErrorStoryProps) {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <CommentsInspectorError error={error} />
    </TestWrapper>
  )
}
