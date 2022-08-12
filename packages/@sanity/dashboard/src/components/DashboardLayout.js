import PropTypes from 'prop-types'
import React, {useMemo} from 'react'
import {Container} from '@sanity/ui'

function DashboardLayout(props) {
  const {width} = props
  const formattedWidth = useMemo(() => getWidth(width), [width])

  return (
    <Container
      width={formattedWidth}
      padding={4}
      sizing="border"
      style={{minHeight: '100%'}}
      data-name="dashboard-layout"
    >
      {props.children}
    </Container>
  )
}

function getWidth(value) {
  const widthMap = {
    small: 2,
    medium: 3,
    large: 4,
  }

  return widthMap?.[value] || widthMap.large
}

DashboardLayout.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  children: PropTypes.any,
  width: PropTypes.oneOf(['small', 'medium', 'large']),
}

DashboardLayout.defaultProps = {
  children: 'Dummy',
}

export default DashboardLayout
