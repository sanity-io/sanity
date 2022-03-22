import type React from 'react'
interface InInputButtonProps {
  kind?: 'add' | 'danger' | 'colored' | 'secondary'
  inverted?: boolean
  icon?: React.ComponentType<React.SVGProps<SVGElement>>
  loading?: boolean
  colored?: boolean
}
export default class InInputButton extends React.Component<
  InInputButtonProps & React.HTMLProps<HTMLButtonElement>
> {
  handleClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  render(): JSX.Element
}
export {}
