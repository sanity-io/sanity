export type BlockStyleItem = {
  active: boolean
  key: string
  // preview: () => JSX.Element
  style: string
  styleComponent: React.ComponentType<{}> | null
  title: string
}
