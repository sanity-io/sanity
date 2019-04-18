import PropTypes from 'prop-types'
import React from 'react'

const Composed = ({wrappers, children}) => {
  console.log(wrappers)
  const Component = wrappers.reverse().reduce(
    (Prev, {component, props}) => {
      console.log(props)
      const Outer = component
      return () => (
        <Outer {...props}>
          <Prev />
        </Outer>
      )
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
