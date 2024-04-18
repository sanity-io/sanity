import {LoadingBlock} from '../../../components'
import {WorkspaceLoader} from '../../../studio'

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
