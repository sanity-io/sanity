import {memo, useMemo} from 'react'

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
): UsePresentationNavigatorState {
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

  return {navigatorEnabled, toggleNavigator}
}

/**
 * Renders the configured navigator panel while it is enabled. A module-scope component rather
 * than one returned from `usePresentationNavigator`, so its identity does not change with the
 * state it renders.
 *
 * @internal
 */
export function PresentationNavigator(
  props: PresentationNavigatorProps & UsePresentationNavigatorProps & {navigatorEnabled: boolean},
) {
  const {navigatorEnabled, unstable_navigator, ...navigatorProps} = props
  if (!navigatorEnabled || !unstable_navigator) return null
  return <Navigator {...unstable_navigator} {...navigatorProps} />
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
