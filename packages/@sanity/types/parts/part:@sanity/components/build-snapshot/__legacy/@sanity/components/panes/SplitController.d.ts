import React from 'react'
interface SplitControllerProps {
  children: React.ReactNode
  collapsedWidth?: number
  isMobile?: boolean
}
export default class PanesSplitController extends React.PureComponent<SplitControllerProps> {
  state: {
    isResizing: boolean
  }
  handleDragStarted: () => void
  handleDragFinished: () => void
  renderSplitPane: (pane1: React.ReactElement, pane2?: React.ReactElement) => JSX.Element
  renderRecursivePanes: (panes: React.ReactElement[]) => any
  render(): any
}
export {}
