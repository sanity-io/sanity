import React from 'react'
import elementResizeDetectorMaker from 'element-resize-detector'
import styles from './styles/enhanceWithAvailableHeight.css'

export default function enhanceWithAvailHeight(Component) {
  return class enhancedWithAvailHeight extends React.PureComponent {
    static displayName = `enhanceWithAvailHeight(${Component.displayName || Component.name})`
    state = {}

    constructor() {
      super()

      this.erd = elementResizeDetectorMaker({strategy: 'scroll'})
    }

    componentWillUnmount() {
      this.teardown(this._element)
    }

    setup(el) {
      if (this._element) {
        this.teardown(this._element)
      }
      this.erd.listenTo(el, this.handleResize)
      this._element = el
    }

    teardown(el) {
      this.erd.removeAllListeners(el)
      this.erd.uninstall(el)
      this._element = null
    }

    setContainer = el => {
      if (el) {
        this.setup(el)
      }
    }

    handleResize = () => {
      this.setState({height: this._element.offsetHeight})
    }

    render() {
      return (
        <div className={styles.root} ref={this.setContainer}>
          <Component {...this.props} {...this.state} />
        </div>
      )
    }
  }
}
