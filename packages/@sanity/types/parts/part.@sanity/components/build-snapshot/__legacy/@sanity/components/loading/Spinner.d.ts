import type React from 'react'
interface SpinnerProps {
  center?: boolean
  delay?: number
  fullscreen?: boolean
  inline?: boolean
  message?: string
}
export default class Spinner extends React.PureComponent<
  SpinnerProps & React.HTMLProps<HTMLDivElement>
> {
  render(): JSX.Element
}
export {}
