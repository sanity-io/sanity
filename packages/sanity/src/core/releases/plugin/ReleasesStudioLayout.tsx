import {ConditionalWrapper} from '../../../ui-components/conditionalWrapper'
import {type LayoutProps} from '../../config'
import {AddonDatasetProvider, useWorkspace} from '../../studio'
import {ReleasesMetadataProvider} from '../contexts/ReleasesMetadataProvider'
import {ReleasesUpsellProvider} from '../contexts/upsell/ReleasesUpsellProvider'

export function ReleasesStudioLayout(props: LayoutProps) {
  const isReleasesEnabled = !!useWorkspace().releases?.enabled

  if (!isReleasesEnabled) {
    return props.renderDefault(props)
  }

  return (
    <ConditionalWrapper
      condition={isReleasesEnabled}
      // eslint-disable-next-line react/jsx-no-bind
      wrapper={(children) => <ReleasesUpsellProvider>{children}</ReleasesUpsellProvider>}
    >
      <AddonDatasetProvider>
        <ReleasesMetadataProvider>{props.renderDefault(props)}</ReleasesMetadataProvider>
      </AddonDatasetProvider>
    </ConditionalWrapper>
  )
}
