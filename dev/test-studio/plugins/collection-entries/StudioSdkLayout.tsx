import {SanityApp, type SanityConfig} from '@sanity/sdk-react'
import {type LayoutProps, useWorkspace} from 'sanity'

export function StudioSdkLayout(props: LayoutProps) {
  const workspace = useWorkspace()
  const config: SanityConfig = {
    projectId: workspace.projectId,
    dataset: workspace.dataset,
    studio: {auth: {token: workspace.auth.token}},
  }

  return (
    <SanityApp config={config} fallback={null}>
      {props.renderDefault(props)}
    </SanityApp>
  )
}
