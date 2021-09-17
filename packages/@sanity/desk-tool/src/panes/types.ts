export interface BaseDeskToolPaneProps<Pane> {
  paneKey: string
  index: number
  itemId: string
  urlParams: Record<string, string | undefined>
  childItemId: string
  isSelected: boolean
  isClosable: boolean
  isActive: boolean
  pane: Pane
}
