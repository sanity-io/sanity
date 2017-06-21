const React = require('react')
const PropTypes = require('prop-types')
const styles = require('./styles/FullscreenError.css')

const FullscreenError = props => {
  return (
    <div className={styles.container}>
      <button className={styles.closeButton} onClick={props.onClose}>✖</button>

      <div className={styles.content}>
        <h1>{props.title}</h1>

        {props.children}
      </div>
    </div>
  )
}

FullscreenError.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired
}

module.exports = FullscreenError
