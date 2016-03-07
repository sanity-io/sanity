import React from 'react'

const DefaultLayout = () =>
  <div className="default-layout">
    <h1>Sanity default layout!</h1>
  </div>

DefaultLayout.childContextTypes = {
  sanity: React.PropTypes.shape({
    getRole: React.PropTypes.func.isRequired
  })
}

export default DefaultLayout
