import {memo, useCallback, useMemo} from 'react'

import {Panel} from './panels/Panel'
import {PanelResizer} from './panels/PanelResizer'
import {getPresentationPanelHtmlId} from './panels/PresentationNarrowTabBar'
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
export interface PresentationNavigatorProps {
  /** Removes the navigator panel from the layout (narrow mode, when another tab is active). */
  hidden?: boolean
  /** Hides the navigator's resizer (narrow mode, where panels never sit side-by-side). */
  resizerHidden?: boolean
}

/** @internal */
export function usePresentationNavigator(
  props: UsePresentationNavigatorProps,
): [UsePresentationNavigatorState, (props: PresentationNavigatorProps) => React.JSX.Element] {
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
    function PresentationNavigator(componentProps: PresentationNavigatorProps) {
      return <>{navigatorEnabled && <Navigator {...unstable_navigator!} {...componentProps} />}</>
    },
    [navigatorEnabled, unstable_navigator],
  )

  return [{navigatorEnabled, toggleNavigator}, Component]
}

function NavigatorComponent(props: NavigatorOptions & PresentationNavigatorProps) {
  const {minWidth, maxWidth, component: NavigatorComponent, hidden, resizerHidden} = props
  // eslint-disable-next-line no-eq-null
  const navigatorDisabled = minWidth != null && maxWidth != null && minWidth === maxWidth
  return (
    <>
      <Panel
        id="navigator"
        htmlId={getPresentationPanelHtmlId('navigator')}
        minWidth={minWidth}
        maxWidth={maxWidth}
        order={1}
        hidden={hidden}
      >
        <NavigatorComponent />
      </Panel>
      <PanelResizer order={2} disabled={navigatorDisabled} hidden={resizerHidden} />
    </>
  )
}
const Navigator = memo(NavigatorComponent)
