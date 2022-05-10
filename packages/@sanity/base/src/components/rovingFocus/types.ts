type NavigationType = 'arrows' | 'tab'

export interface RovingFocusProps {
  direction?: 'horizontal' | 'vertical'
  initialFocus?: 'first' | 'last'
  navigation?: NavigationType[]
  loop?: boolean
  pause?: boolean
  rootElement: HTMLElement | HTMLDivElement | null
}
