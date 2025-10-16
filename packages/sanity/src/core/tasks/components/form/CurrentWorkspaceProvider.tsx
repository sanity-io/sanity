import {LoadingBlock} from '../../../components/loadingBlock/LoadingBlock'
import {WorkspaceLoader} from '../../../studio/workspaceLoader/WorkspaceLoader'

function ConfigErrorsScreen() {
  // eslint-disable-next-line i18next/no-literal-string
  return <div>Config errors</div>
}

export function CurrentWorkspaceProvider({children}: {children: React.ReactNode}) {
  return (
    <WorkspaceLoader LoadingComponent={LoadingBlock} ConfigErrorsComponent={ConfigErrorsScreen}>
      {children}
    </WorkspaceLoader>
  )
}
