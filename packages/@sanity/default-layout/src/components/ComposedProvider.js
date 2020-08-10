import PropTypes from 'prop-types'
import React from 'react'

/* eslint-disable react/no-multi-comp */
const Composed = ({wrappers, children}) => {
  const Component = wrappers.reduce(
    (Prev, {component, props}) => {
      const Outer = component
      const Wrapped = () => (
        <Outer {...props}>
          <Prev />
        </Outer>
      )
      return Wrapped
    },
    () => <React.Fragment>{children}</React.Fragment>
  )

  return <Component>{children}</Component>
}

Composed.propTypes = {
  children: PropTypes.element.isRequired,
  wrappers: PropTypes.arrayOf(
    PropTypes.shape({
      component: PropTypes.element,
      props: PropTypes.shape({})
    })
  )
}

Composed.defaultProps = {
  wrappers: []
}

export default Composed
