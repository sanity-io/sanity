import React, {PropTypes} from 'react'
import getClassNames from 'classnames'

export default function Button(props) {
  const {kind, loading, className, colored, ...rest} = props
  const classNames = getClassNames('pure-button', className, {
    'pure-button-primary': colored || kind === 'colored',
    loading
  })

  return <button className={classNames} {...rest} />
}

Button.propTypes = {
  kind: PropTypes.oneOf(['add', 'danger', 'colored', 'secondary', 'simple']),
  onClick: PropTypes.func,
  children: PropTypes.node,
  loading: PropTypes.bool,
  colored: PropTypes.bool,
  className: PropTypes.string,
  disabled: PropTypes.bool
}
