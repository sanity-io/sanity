import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/previews/card-style'
import Moment from 'moment'
import {debounce} from 'lodash'

export default class CardPreview extends React.Component {
  static propTypes = {
    item: PropTypes.shape({
      title: PropTypes.string,
      subtitle: PropTypes.string,
      description: PropTypes.string,
      mediaRender: PropTypes.func,
      date: PropTypes.object
    }),
    emptyText: PropTypes.string,
    children: PropTypes.node
  }

  static defaultProps = {
    emptyText: 'Nothing here…',
  }

  constructor(props, context) {
    super(props, context)
    this.state = {
      emWidth: 10
    }
  }

  onResize = debounce(() => {
    const el = this.inner
    if (el) {
      const fontSize = window.getComputedStyle(el, null).getPropertyValue('font-size').split('px')[0]
      const emWidth = el.offsetWidth / fontSize
      this.setState({
        emWidth: emWidth
      })
    }
  }, 1000 / 60)

  componentDidMount() {
    window.addEventListener('resize', this.onResize)
    this.onResize()
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize)
  }

  setInnerElement = inner => {
    this.inner = inner
  }

  render() {
    const {item, emptyText, children} = this.props
    const {emWidth} = this.state

    if (!item) {
      return (
        <div className={`${styles.empty}`}>
          {emptyText}
        </div>
      )
    }

    return (
      <div className={`${styles.root}`}>
        <div className={styles.inner} ref={this.setInnerElement}>
          <div className={`${styles.media}`}>
            {item.mediaRender && item.mediaRender()}
          </div>
          <div className={styles.meta} ref="meta">
            <div className={styles.heading}>
              <p className={styles.date}>
                {
                  emWidth <= 20 && Moment(item.date).format('L')
                }
                {
                  emWidth <= 30 && emWidth > 20 && Moment(item.date).format('LLL')
                }
                {
                  emWidth > 30 && Moment(item.date).format('LLLL')
                }
              </p>
              <h2 className={styles.title}>
                {item.title || emptyText}
              </h2>
              <h3 className={styles.subtitle}>
                {item.subtitle}
              </h3>
            </div>
            <p className={styles.description}>{item.description}</p>
            {children}
          </div>
        </div>
      </div>
    )
  }
}
