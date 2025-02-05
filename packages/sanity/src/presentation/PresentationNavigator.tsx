import {memo, useCallback, useMemo} from 'react'

import {Panel} from './panels/Panel'
import {PanelResizer} from './panels/PanelResizer'
import {type NavigatorOptions} from './types'
import {useLocalState} from './useLocalState'

/** @internal */
export interface UsePresentationNavigatorProps {
  unstable_navigator?: NavigatorOptions
}

/** @internal */
export interface UsePresentationNavigatorState {
  navigatorEnabled: boolean
  toggleNavigator: (() => void) | undefined
}

/** @internal */
export function usePresentationNavigator(
  props: UsePresentationNavigatorProps,
): [UsePresentationNavigatorState, () => React.JSX.Element] {
  const {unstable_navigator} = props

  const navigatorProvided = !!unstable_navigator?.component
  const [_navigatorEnabled, setNavigatorEnabled] = useLocalState<boolean>(
    'presentation/navigator',
    navigatorProvided,
  )
  const navigatorEnabled = navigatorProvided ? _navigatorEnabled : false
  const toggleNavigator = useMemo(() => {
    if (!navigatorProvided) return undefined

    return () => setNavigatorEnabled((enabled) => !enabled)
  }, [navigatorProvided, setNavigatorEnabled])

  const Component = useCallback(
    function PresentationNavigator() {
      return <>{navigatorEnabled && <Navigator {...unstable_navigator!} />}</>
    },
    [navigatorEnabled, unstable_navigator],
  )

  return [{navigatorEnabled, toggleNavigator}, Component]
}

function NavigatorComponent(props: NavigatorOptions) {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const {minWidth, maxWidth, component: NavigatorComponent} = props
  // eslint-disable-next-line no-eq-null
  const navigatorDisabled = minWidth != null && maxWidth != null && minWidth === maxWidth
  return (
    <>
      <Panel id="navigator" minWidth={minWidth} maxWidth={maxWidth} order={1}>
        <NavigatorComponent />
      </Panel>
      <PanelResizer order={2} disabled={navigatorDisabled} />
    </>
  )
}
const Navigator = memo(NavigatorComponent)
