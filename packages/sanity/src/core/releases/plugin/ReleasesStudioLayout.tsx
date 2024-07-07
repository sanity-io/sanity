import {type LayoutProps} from '../../config'
import {AddonDatasetProvider} from '../../studio'
import {BundlesMetadataProvider} from '../contexts/BundlesMetadataProvider'

export function ReleasesStudioLayout(props: LayoutProps) {
  // TODO: Replace for useReleasesEnabled
  const {enabled} = {enabled: true}

  if (!enabled) {
    return props.renderDefault(props)
  }

  return (
    <AddonDatasetProvider>
      <BundlesMetadataProvider>{props.renderDefault(props)}</BundlesMetadataProvider>
    </AddonDatasetProvider>
  )
}
