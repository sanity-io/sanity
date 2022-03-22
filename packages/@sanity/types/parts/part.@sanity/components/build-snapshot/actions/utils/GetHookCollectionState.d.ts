import type React from 'react'
interface Props<T, K> {
  hooks: ((args: T) => K)[]
  args: T
  component: React.ComponentProps<any> &
    React.Component<{
      state: K[]
    }>
  onReset?: () => void
}
export declare function GetHookCollectionState<T, K>(props: Props<T, K>): JSX.Element
export {}
