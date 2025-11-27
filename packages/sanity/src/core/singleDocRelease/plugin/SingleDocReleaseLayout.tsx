import {type LayoutProps} from '../../config/studio/types'
import {SingleDocReleaseEnabledProvider} from '../context/SingleDocReleaseEnabledProvider'
import {SingleDocReleaseUpsellProvider} from '../context/SingleDocReleaseUpsellProvider'

export function SingleDocReleaseLayout(props: LayoutProps) : React.JSX.Element {
  return (
    <SingleDocReleaseEnabledProvider>
      <SingleDocReleaseUpsellProvider>{props.renderDefault(props)}</SingleDocReleaseUpsellProvider>
    </SingleDocReleaseEnabledProvider>
  )
}
