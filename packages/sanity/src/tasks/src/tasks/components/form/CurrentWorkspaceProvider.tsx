import {LoadingBlock, WorkspaceLoader} from 'sanity'

function ConfigErrorsScreen() {
  return <div>Config errors</div>
}

export function CurrentWorkspaceProvider({children}: {children: React.ReactNode}) {
  return (
    <WorkspaceLoader LoadingComponent={LoadingBlock} ConfigErrorsComponent={ConfigErrorsScreen}>
      {children}
    </WorkspaceLoader>
  )
}
