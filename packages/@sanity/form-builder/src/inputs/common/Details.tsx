import React, {CSSProperties} from 'react'
const ARROW_STYLE = {
  fontSize: '0.8em',
  display: 'inline-block',
  width: '1em',
  marginRight: '0.4em'
}
const CONTAINER_STYLE: CSSProperties = {
  cursor: 'default',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  outline: 'none',
  marginBottom: '0.5em'
}
type DetailsProps = {
  isOpen?: boolean
  title?: React.ReactNode
}
type DetailsState = {
  isOpen: any
}
export default class Details extends React.Component<DetailsProps, DetailsState> {
  static defaultProps = {
    title: 'Details',
    isOpen: false
  }
  constructor(props) {
    super(props)
    this.state = {
      isOpen: props.isOpen
    }
  }
  handleToggle = () => {
    this.setState(prevState => ({isOpen: !prevState.isOpen}))
  }
  render() {
    const {isOpen} = this.state
    const {title, children} = this.props
    return (
      <div>
        <div tabIndex={0} onClick={this.handleToggle} style={CONTAINER_STYLE}>
          <span style={ARROW_STYLE}>{isOpen ? '▼' : '▶'}</span>
          {title}
        </div>
        {isOpen ? children : null}
      </div>
    )
  }
}
