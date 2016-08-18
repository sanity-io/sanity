import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/lists/items/grid'

export default class GridItem extends React.Component {
  static propTypes = {
    title: PropTypes.string,
    content: PropTypes.node,
    index: PropTypes.string,
    extraContent: PropTypes.node,
    icon: PropTypes.node,
    onClick: PropTypes.func,
    onSelect: PropTypes.func,
    layout: PropTypes.string,
    description: PropTypes.string,
    image: PropTypes.string,
    square: PropTypes.bool,
    showInfo: PropTypes.bool,
    children: PropTypes.node,
    className: PropTypes.string
  }

  static defaultProps = {
    onClick() {},
    action() {},
    onSelect() {},
    height: 100,
    width: 133
  }

  constructor(context, props) {
    super(context, props)
    this.handleClick = this.handleClick.bind(this)
    this.handleMouseDown = this.handleMouseDown.bind(this)
    this.handleMouseUp = this.handleMouseUp.bind(this)
    this.state = {
      loading: false,
      mouseIsDown: false
    }
  }

  componentDidMount() {
    // const image = new Image()
    // image.src = this.props.image
    // image.onload = () => {
    //   this.setState({
    //     loading: false
    //   })
    // }
  }

  handleClick(event) {
    this.props.onSelect(event)
  }

  handleMouseDown(event) {
    this.setState({
      mouseIsDown: true
    })
  }
  handleMouseUp(event) {
    this.setState({
      mouseIsDown: false
    })
  }

  render() {
    const {children, className} = this.props
    const {mouseIsDown} = this.state

    const rootStyles = `
      ${styles.root}
      ${mouseIsDown && styles.active}
      ${className}
    `
    return (
      <div
        className={rootStyles}
        onClick={this.handleClick}
        onMouseDown={this.handleMouseDown}
        onMouseUp={this.handleMouseUp}
      >
        <div className={styles.inner}>
          {children}
        </div>
      </div>
    )
  }
}
