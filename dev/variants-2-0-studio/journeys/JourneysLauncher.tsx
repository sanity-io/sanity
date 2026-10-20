import {Card} from '@sanity/ui'

import {Button} from '../../../packages/sanity/src/ui-components/button/Button'
import {CONTROL_HEIGHT} from '../shared/sizes'
import {TAB_ID} from './RemoteListener'

// The in-studio Journeys panel is gone: the journeys are driven from the Journeys remote (static/remote.html), a window of
// its own. This is the button that opens it (bottom left, next to Design options). The remote keeps the same storage key
// for the done marks, and journeys.json is its data.
export const JOURNEYS_REMOTE_URL = '/static/remote.html'

export function JourneysLauncher() {
  return (
    <div style={{bottom: 16, left: 270, position: 'fixed', zIndex: 1000000}}>
      <Card radius={2} shadow={2}>
        <Button
          mode="bleed"
          // The remote starts bound to the tab that opened it, so it moves the page you clicked in.
          onClick={() => window.open(`${JOURNEYS_REMOTE_URL}?tab=${TAB_ID}`, 'variants-2-0-remote', 'popup,width=1280,height=860')}
          style={{height: CONTROL_HEIGHT}}
          text="Journeys"
          tooltipProps={{content: 'Open the Journeys remote in its own window'}}
        />
      </Card>
    </div>
  )
}
