export interface BaseDeskToolPaneProps<Pane> {
  paneKey: string
  index: number
  itemId: string
  childItemId: string
  isSelected: boolean
  isClosable: boolean
  isActive: boolean
  pane: Pane
}
