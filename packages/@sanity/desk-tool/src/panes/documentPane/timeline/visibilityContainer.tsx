import React, {createRef, useRef, useEffect} from 'react'

export type Props = {
  padding?: number
  setVisibility: (isVisible: boolean) => void
}

export default class VisbilityContainer extends React.Component<Props> {
  ref = createRef<HTMLDivElement>()

  componentDidMount() {
    this.recalculate()
  }

  componentDidUpdate() {
    this.recalculate()
  }

  componentWillUnmount() {
    this.props.setVisibility(false)
  }

  recalculate() {
    const dom = this.ref.current
    const {padding = 0, setVisibility} = this.props

    if (dom && dom.parentElement) {
      const {offsetHeight, scrollTop} = dom.parentElement
      const bottomPosition = offsetHeight + scrollTop + padding
      const isVisible = dom.offsetTop < bottomPosition
      setVisibility(isVisible)
    }
  }

  render() {
    return <div ref={this.ref}>{this.props.children}</div>
  }
}
