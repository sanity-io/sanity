import {type LayoutProps} from '../../config'
import {AddonDatasetProvider} from '../../studio'

export function ReleasesStudioLayout(props: LayoutProps) {
  // TODO: Replace for useReleasesEnabled
  const {enabled, mode} = {enabled: true, mode: 'default'}

  if (!enabled) {
    return props.renderDefault(props)
  }

  return <AddonDatasetProvider>{props.renderDefault(props)}</AddonDatasetProvider>
}
