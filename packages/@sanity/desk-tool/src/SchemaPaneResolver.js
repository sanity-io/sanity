import PropTypes from 'prop-types'
import React from 'react'

import dataAspects from './utils/dataAspects'
import schema from 'part:@sanity/base/schema'
import styles from './styles/SchemaPaneResolver.css'

import TypePane from './pane/TypePane'
import DocumentsPane from './pane/DocumentsPane'
import EditorWrapper from './pane/EditorWrapper'
import GetStarted from './GetStarted'
import SplitController from 'part:@sanity/components/panes/split-controller'
import SplitPaneWrapper from 'part:@sanity/components/panes/split-pane-wrapper'
import Snackbar from 'part:@sanity/components/snackbar/default'

const TYPE_ITEMS = dataAspects.getInferredTypes().map(typeName => ({
  key: typeName,
  name: typeName,
  title: dataAspects.getDisplayName(typeName)
}))

export default class SchemaPaneResolver extends React.Component {
  static propTypes = {
    router: PropTypes.shape({
      state: PropTypes.object
    }).isRequired
  }

  state = {
    collapsedPanes: []
  }

  componentWillReceiveProps(nextProps) {
    const nextType = nextProps.router.state && nextProps.router.state.selectedType
    const currentType = this.props.router.state && this.props.router.state.selectedType
    if (nextType !== currentType) {
      this.setState({
        collapsedPanes: []
      })
    }
  }

  handleToggleDocumentsPaneMenu = () => {
    this.setState({
      documentPaneMenuIsOpen: !this.state.documentPaneMenuIsOpen
    })
  }

  handleCloseDocumentsPaneMenu = () => {
    this.setState({
      documentPaneMenuIsOpen: false
    })
  }

  handleShouldCollapse = pane => {
    const collapsedPanes = this.state.collapsedPanes
    collapsedPanes.push(pane.props.paneId)
    this.setState({
      collapsedPanes: collapsedPanes
    })
  }

  handleShouldExpand = pane => {
    this.setState({
      collapsedPanes: this.state.collapsedPanes.filter(p => p !== pane.props.paneId) //eslint-disable-line id-length
    })
  }

  render() {
    const {router} = this.props
    const {collapsedPanes} = this.state
    const {selectedType, selectedDocumentId, action} = router.state
    const schemaType = schema.get(router.state.selectedType)

    if (TYPE_ITEMS.length === 0) {
      return <GetStarted />
    }

    return (
      <div className={styles.container}>
        <SplitController
          onShouldCollapse={this.handleShouldCollapse}
          onShouldExpand={this.handleShouldExpand}
        >
          <SplitPaneWrapper
            defaultWidth={200}
            minWidth={100}
            paneId="typePane"
            isCollapsed={!!collapsedPanes.find(pane => pane === 'typePane')}
          >
            <TypePane
              isCollapsed={!!collapsedPanes.find(pane => pane === 'typePane')}
              title="Content"
              paneId="typePane"
              items={TYPE_ITEMS}
              router={router}
              onExpand={this.handleShouldExpand}
              onCollapse={this.handleShouldCollapse}
            />
          </SplitPaneWrapper>
          {schemaType &&
            selectedType && (
              <SplitPaneWrapper
                defaultWidth={300}
                minWidth={100}
                maxWidth={400}
                paneId="documentsPane"
                isCollapsed={!!collapsedPanes.find(pane => pane === 'documentsPane')}
              >
                <DocumentsPane
                  key={selectedType}
                  isCollapsed={!!collapsedPanes.find(pane => pane === 'documentsPane')}
                  selectedType={selectedType}
                  title={dataAspects.getDisplayName(selectedType) || 'Untitled'}
                  selectedDocumentId={selectedDocumentId}
                  schemaType={schemaType}
                  router={router}
                  paneId="documentsPane"
                  onExpand={this.handleShouldExpand}
                  onCollapse={this.handleShouldCollapse}
                />
              </SplitPaneWrapper>
            )}
          {!schemaType &&
            !selectedType && (
              <SplitPaneWrapper>
                <div className={styles.selectContentType}>Select content type</div>
              </SplitPaneWrapper>
            )}
          {schemaType &&
            selectedDocumentId &&
            action === 'edit' && (
              <SplitPaneWrapper>
                <EditorWrapper
                  key={selectedDocumentId}
                  documentId={selectedDocumentId}
                  typeName={schemaType.name}
                  schemaType={schemaType}
                />
              </SplitPaneWrapper>
            )}

          {selectedType &&
            !schemaType && (
              <SplitPaneWrapper>
                <h2 className={styles.emptyText}>
                  Could not find any type named{' '}
                  <strong>
                    <em>{selectedType}</em>
                  </strong>{' '}
                  in schema{' '}
                  <strong>
                    <em>{schema.name}</em>
                  </strong>…
                </h2>
              </SplitPaneWrapper>
            )}
        </SplitController>
        {selectedType &&
          schemaType &&
          action &&
          action !== 'edit' && (
            // this would normally never happen
            <Snackbar kind="error">Invalid action: {action}</Snackbar>
          )}
      </div>
    )
  }
}
