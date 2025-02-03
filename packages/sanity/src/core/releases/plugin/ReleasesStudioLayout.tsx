import {type ComponentType} from 'react'

import {type LayoutProps} from '../../config'
import {useWorkspace} from '../../studio'
import {ReleasesMetadataProvider} from '../contexts/ReleasesMetadataProvider'
import {ReleasesUpsellProvider} from '../contexts/upsell/ReleasesUpsellProvider'

export const ReleasesStudioLayout: ComponentType<LayoutProps> = (props) => {
  const isReleasesEnabled = !!useWorkspace().releases?.enabled

  if (!isReleasesEnabled) {
    return props.renderDefault(props)
  }

  return (
    <ReleasesUpsellProvider>
      <ReleasesMetadataProvider>{props.renderDefault(props)}</ReleasesMetadataProvider>
    </ReleasesUpsellProvider>
  )
}
