import {combineLatest} from 'rxjs'
import {map} from 'rxjs/operators'

import {type WorkspaceSummary} from '../../../../../config/types'
import {createHookFromObservableFactory} from '../../../../../util/createHookFromObservableFactory'

export const useWorkspaceAuthStates = createHookFromObservableFactory(
  (workspaces: WorkspaceSummary[]) =>
    combineLatest(
      workspaces.map((workspace) =>
        // eslint-disable-next-line max-nested-callbacks
        workspace.auth.state.pipe(map((state) => [workspace.name, state] as const)),
      ),
    ).pipe(map((entries) => Object.fromEntries(entries))),
)
