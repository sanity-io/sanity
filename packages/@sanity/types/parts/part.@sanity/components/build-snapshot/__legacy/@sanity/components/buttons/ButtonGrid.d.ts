import type React from 'react'
interface ButtonGridProps {
  secondary?: React.ReactNode
  align?: 'start' | 'end'
}
export default class ButtonGrid extends React.PureComponent<
  ButtonGridProps & React.HTMLProps<HTMLDivElement>
> {
  render(): JSX.Element
}
export {}
