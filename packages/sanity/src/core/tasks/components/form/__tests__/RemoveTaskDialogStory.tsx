import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {tasksUsEnglishLocaleBundle} from '../../../i18n'
import {RemoveTaskDialog} from '../RemoveTaskDialog'

const NOOP = () => undefined

/**
 * Destructive confirm dialog for deleting a task. Pins the ui5 `Text` /
 * `VStack` body against the studio Dialog footer after the Sanity UI theme
 * swap — critical confirm vs cancel, and the loading confirm state.
 */
export function RemoveTaskDialogStory(props: {removeStatus?: 'idle' | 'loading'}) {
  const {removeStatus = 'idle'} = props
  return (
    <TestWrapper i18nBundles={[tasksUsEnglishLocaleBundle]} schemaTypes={[]}>
      <RemoveTaskDialog
        error={null}
        handleCloseDialog={NOOP}
        handleOpenDialog={NOOP}
        handleRemove={NOOP}
        removeStatus={removeStatus}
        showDialog
      />
    </TestWrapper>
  )
}
