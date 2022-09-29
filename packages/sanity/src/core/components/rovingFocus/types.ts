/** @beta */
export type RovingFocusNavigationType = 'arrows' | 'tab'

/** @beta */
export interface RovingFocusProps {
  direction?: 'horizontal' | 'vertical'
  initialFocus?: 'first' | 'last'
  navigation?: RovingFocusNavigationType[]
  loop?: boolean
  pause?: boolean
  rootElement: HTMLElement | HTMLDivElement | null
}
