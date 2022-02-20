export interface RovingFocusProps {
  direction?: 'horizontal' | 'vertical'
  initialFocus?: 'first' | 'last'
  loop?: boolean
  pause?: boolean
  rootElement: HTMLElement | HTMLDivElement | null
}
