import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/lists/items/thumb'

export default class Thumb extends React.Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    content: PropTypes.node,
    key: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    extraContent: PropTypes.node,
    icon: PropTypes.node,
    action: PropTypes.func,
    onClick: PropTypes.func,
    layout: PropTypes.string,
    description: PropTypes.string,
    image: PropTypes.string,
    square: PropTypes.bool,
    showInfo: PropTypes.bool
  }

  static defaultProps = {
    onClick() {},
    action() {}
  }

  constructor(context, props) {
    super(context, props)
    this.handleClick = this.handleClick.bind(this)
  }

  handleClick(id) {
    this.props.onClick(this.props.id)
    this.props.action('Clicked')
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
