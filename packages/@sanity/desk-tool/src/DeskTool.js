import React from 'react'
import styles from './styles/DeskTool.css'
import SchemaPaneResolver from './SchemaPaneResolver'
import client from 'part:@sanity/base/client'
import {withRouterHOC} from 'part:@sanity/base/router'
import PropTypes from 'prop-types'

export default withRouterHOC(
  class DeskTool extends React.Component {
    static propTypes = {
      router: PropTypes.shape({
        state: PropTypes.object
      }).isRequired
    }

    componentWillReceiveProps(nextProps) {
      this.checkRedirect(nextProps)
    }

    componentDidMount() {
      this.checkRedirect(this.props)
    }

    checkRedirect(props) {
      const {router} = props
      const {selectedType, selectedDocumentId} = router.state
      if (selectedType === '*' && selectedDocumentId && selectedType) {
        this.checkType(selectedDocumentId, selectedType)
      }
    }

    checkType(documentId, expectedType) {
      if (this._checkTypeSubscription) {
        this._checkTypeSubscription.unsubscribe()
      }
      this._checkTypeSubscription = client.observable
        .fetch(`*[_id == "${documentId}" || _id == "drafts.${documentId}"][0]._type`)
        .subscribe(actualType => {
          if (actualType && actualType !== expectedType) {
            const {router} = this.props
            router.navigate({...router.state, selectedType: actualType}, {replace: true})
          }
        })
    }

    render() {
      const {router} = this.props

      return (
        <div className={styles.deskTool}>
          <SchemaPaneResolver router={router} />
        </div>
      )
    }
  }
)
