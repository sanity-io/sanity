import {map} from 'rxjs/operators'
import {combineLatest} from 'rxjs'
import {WorkspaceSummary} from '../../../../../config'
import {createHookFromObservableFactory} from '../../../../../util'

export const useWorkspaceAuthStates = createHookFromObservableFactory(
  (workspaces: WorkspaceSummary[]) =>
    combineLatest(
      workspaces.map((workspace) =>
        // eslint-disable-next-line max-nested-callbacks
        workspace.auth.state.pipe(map((state) => [workspace.name, state] as const)),
      ),
    ).pipe(map((entries) => Object.fromEntries(entries))),
)
