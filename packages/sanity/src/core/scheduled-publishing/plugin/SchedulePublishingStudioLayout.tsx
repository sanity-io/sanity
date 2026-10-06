import {type LayoutProps} from '../../config/studio/types'
import {SchedulePublishingUpsellProvider} from '../tool/contexts/SchedulePublishingUpsellProvider'

export function SchedulePublishingStudioLayout(props: LayoutProps) {
  // Same tree in both modes, so the layout never waits for the feature check or the usage probe;
  // the upsell provider is only consulted by UI that already knows it is in upsell mode.
  return (
    <SchedulePublishingUpsellProvider>
      {props.renderDefault(props)}
    </SchedulePublishingUpsellProvider>
  )
}
