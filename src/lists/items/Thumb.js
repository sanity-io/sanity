import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/lists/items/thumb'

import Spinner from 'component:@sanity/components/loading/spinner'

export default class Thumb extends React.Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    content: PropTypes.node,
    index: PropTypes.string.isRequired,
    extraContent: PropTypes.node,
    icon: PropTypes.node,
    onClick: PropTypes.func,
    layout: PropTypes.string,
    description: PropTypes.string,
    image: PropTypes.string,
    square: PropTypes.bool,
    showInfo: PropTypes.bool
  }

  static defaultProps = {
    onClick() {},
    action() {},
    height: 100,
    width: 133
  }

  constructor(context, props) {
    super(context, props)
    this.handleClick = this.handleClick.bind(this)
    this.state = {
      loading: true
    }
  }

  componentDidMount() {
    const image = new Image()
    image.src = this.props.image
    image.onload = () => {
      this.setState({
        loading: false
      })
    }
  }

  handleClick(index) {
    this.props.onClick(this.props.index)
  }

  render() {
    const {layout, title, image, description, square, showInfo} = this.props

    const rootStyles = `
    ${styles[layout] || styles.root}
    ${square && styles.square}
    `
    return (
      <div className={rootStyles} onClick={this.handleClick}>
        <div className={styles.inner}>

          {
            this.state.loading
            && <div className={styles.spinner}>
              <Spinner />
            </div>
          }

          <img className={styles.image} src={image} />
          {
            showInfo && <div className={styles.info}>
              {
                title && <div className={styles.title}>{title}</div>
              }
              {
                description && <p className={styles.description}>{description}</p>
              }
            </div>
          }
        </div>
      </div>
    )
  }
}
