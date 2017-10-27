import React from 'react'
import styles from './styles/DeskTool.css'
import SchemaPaneResolver from './SchemaPaneResolver'
import client from 'part:@sanity/base/client'
import {withRouterHOC} from 'part:@sanity/base/router'
import PropTypes from 'prop-types'

export default withRouterHOC(class DeskTool extends React.Component {
  static propTypes = {
    router: PropTypes.shape({
      state: PropTypes.object
    }).isRequired
  }
  componentDidMount() {
    const {router} = this.props
    const {selectedType, selectedDocumentId} = router.state
    if (selectedDocumentId && selectedType) {
      client.fetch('*[_id == $id][0]._type', {id: selectedDocumentId})
        .then(type => {
          if (type !== selectedType) {
            router.navigate({...router.state, selectedType: type}, {replace: true})
          }
        })
    }
  }

  render() {
    const {router} = this.props

    return (
      <div className={styles.deskTool}>
        <SchemaPaneResolver router={router} />
      </div>
    )
  }
})
