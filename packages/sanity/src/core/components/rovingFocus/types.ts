/**
 * @hidden
 * @beta */
export type RovingFocusNavigationType = 'arrows' | 'tab'

/**
 * @hidden
 * @beta */
export interface RovingFocusProps {
  direction?: 'horizontal' | 'vertical'
  initialFocus?: 'first' | 'last'
  navigation?: RovingFocusNavigationType[]
  loop?: boolean
  pause?: boolean
  rootElement: HTMLElement | HTMLDivElement | null
}
