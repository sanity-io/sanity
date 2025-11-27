type Props = {
  value: string | boolean | number
}
export function PreviewPrimitive(props: Props) : React.JSX.Element {
  return <span>{props.value}</span>
}
