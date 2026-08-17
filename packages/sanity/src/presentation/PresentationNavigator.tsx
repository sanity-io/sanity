import {memo, useCallback, useMemo} from 'react'

import {Panel} from './panels/Panel'
import {PanelResizer} from './panels/PanelResizer'
import {getPresentationPanelHtmlId} from './panels/presentationLayoutTab'
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
  /** Hide the navigator panel (narrow mode, another tab active). */
  hidden?: boolean
  /** Hide the navigator's resizer (narrow mode). */
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
