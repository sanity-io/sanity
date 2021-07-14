import PropTypes from 'prop-types'
import React from 'react'
import {Container} from '@sanity/ui'

function DashboardLayout(props) {
  return (
    <Container width={4} padding={4} sizing="border" style={{minHeight: '100%'}}>
      {props.children}
    </Container>
  )
}

DashboardLayout.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  children: PropTypes.any,
}

DashboardLayout.defaultProps = {
  children: 'Dummy',
}

export default DashboardLayout
