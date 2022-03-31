import React from 'react'
interface TabbedPaneProps {
  idPrefix: string
  views?: {
    icon?: React.ComponentType<Record<string, unknown>>
    id: string
    title: string
  }[]
  activeView?: string
  isClosable?: boolean
  onSetActiveView: (viewId: string | null) => void
  onSplitPane?: () => void
  onCloseView?: () => void
}
declare class TabbedPane extends React.Component<TabbedPaneProps> {
  renderHeaderViewMenu: () => JSX.Element
  renderTabs(): JSX.Element
  render(): JSX.Element
}
export default TabbedPane
