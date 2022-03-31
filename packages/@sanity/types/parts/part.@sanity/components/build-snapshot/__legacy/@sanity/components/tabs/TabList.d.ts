import React from 'react'
interface TabListProps {
  children: React.ReactElement[]
}
interface State {
  focusedTabIdx: number
}
export default class TabList extends React.PureComponent<TabListProps, State> {
  state: State
  handleTabFocus: (tabIdx: number) => void
  handleKeyDown: (evt: React.KeyboardEvent<HTMLDivElement>) => void
  render(): JSX.Element
}
export {}
