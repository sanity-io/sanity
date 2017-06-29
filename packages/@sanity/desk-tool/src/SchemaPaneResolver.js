import PropTypes from 'prop-types'
import React from 'react'

import dataAspects from './utils/dataAspects'
import schema from 'part:@sanity/base/schema'
import styles from './styles/SchemaPaneResolver.css'
import {withRouterHOC} from 'part:@sanity/base/router'

import TypePane from './pane/TypePane'
import DocumentsPane from './pane/DocumentsPane'
import EditorWrapper from './pane/EditorWrapper'

import SplitController from 'part:@sanity/components/panes/split-controller'
import SplitPaneWrapper from 'part:@sanity/components/panes/split-pane-wrapper'

const TYPE_ITEMS = dataAspects.getInferredTypes().map(typeName => ({
  key: typeName,
  name: typeName,
  title: dataAspects.getDisplayName(typeName)
}))

export default withRouterHOC(class SchemaPaneResolver extends React.Component {
  static propTypes = {
    router: PropTypes.shape({
      state: PropTypes.object
    }).isRequired
  }

  state = {
    collapsedPanes: []
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

    return (
      <div className={styles.container}>
        <SplitController
          onSholdCollapse={this.handleShouldCollapse}
          onSholdExpand={this.handleShouldExpand}
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
            >
              test
            </TypePane>
          </SplitPaneWrapper>


          {
            schemaType && selectedType && (
              <SplitPaneWrapper
                defaultWidth={300}
                minWidth={100}
                maxWidth={400}
                paneId="documentsPane"
                isCollapsed={!!collapsedPanes.find(pane => pane === 'documentsPane')}
              >
                <DocumentsPane
                  isCollapsed={!!collapsedPanes.find(pane => pane === 'documentsPane')}
                  selectedType={selectedType}
                  selectedDocumentId={selectedDocumentId}
                  schemaType={schemaType}
                  router={router}
                  paneId="documentsPane"
                  onExpand={this.handleShouldExpand}
                  onCollapse={this.handleShouldCollapse}
                />
              </SplitPaneWrapper>
            )
          }

          {
            schemaType && selectedDocumentId && action === 'edit' && (
              <SplitPaneWrapper>
                <EditorWrapper
                  documentId={selectedDocumentId}
                  typeName={schemaType.name}
                  schemaType={schemaType}
                />
              </SplitPaneWrapper>
            )
          }
          {/* {
            schemaType && !selectedDocumentId && (
              <div className={styles.editorCreateNew}>
                <IntentLink
                  intent="create"
                  params={{type: selectedType}}
                  className={styles.editorCreateNewLink}
                >
                  Create new &quot;{schemaType.title}&quot;
                </IntentLink>
              </div>
            )
          }

          {
            selectedType && !schemaType && (
            <h2 className={styles.emptyText}>
              Could not find any type
              named <strong><em>{selectedType}</em></strong> in
              schema <strong><em>{schema.name}</em></strong>…
            </h2>
            )
          }
          {
            action && action !== 'edit' && (
            // this would normally never happen
            <h2 className={styles.emptyText}>
              Invalid action: {action}
            </h2>
            )
          }

          {
            !selectedType && (
            <h2 className={styles.emptyText}>Select a type to begin…</h2>
            )
          } */}

        </SplitController>
      </div>
    )
  }
})
