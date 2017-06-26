import PropTypes from 'prop-types'
import React from 'react'
import DocumentsPane from './pane/DocumentsPane'
import EditorWrapper from './pane/EditorWrapper'
import TypePaneItem from './pane/TypePaneItem.js'

import dataAspects from './utils/dataAspects'
import schema from 'part:@sanity/base/schema'
import styles from './styles/SchemaPaneResolver.css'
import {withRouterHOC} from 'part:@sanity/base/router'
import SplitController from 'part:@sanity/components/panes/split-controller'
import SplitPaneWrapper from 'part:@sanity/components/panes/split-pane-wrapper'
import Pane from 'part:@sanity/components/panes/default'
import typePaneStyles from './pane/styles/TypePane.css'

const TYPE_ITEMS = dataAspects.getInferredTypes().map(typeName => ({
  key: typeName,
  name: typeName,
  title: dataAspects.getDisplayName(typeName)
}))


export default withRouterHOC(class SchemaPaneResolver extends React.Component {
  static propTypes = {
    router: PropTypes.shape({
      state: PropTypes.object
    })
  }

  state = {
    collapsedPanes: []
  }

  renderTypePaneItem = item => {
    const {selectedType} = this.props.router.state
    const selected = item.name === selectedType
    return (
      <TypePaneItem
        key={item.key}
        selected={selected}
        type={item}
        onClick={this.handleItemClick}
      />
    )
  }

  setContainerElement = element => {
    this.containerElement = element
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
      collapsedPanes: this.state.collapsedPanes.filter(p => p !== pane.props.paneId)
    })
  }

  render() {
    const {router} = this.props
    const {collapsedPanes} = this.state
    const {selectedType, selectedDocumentId, action} = router.state
    const schemaType = schema.get(router.state.selectedType)

    return (
      <div className={styles.container} ref={this.setContainerElement}>
        <SplitController
          onSholdCollapse={this.handleShouldCollapse}
          onSholdExpand={this.handleShouldExpand}
        >
          <SplitPaneWrapper
            defaultWidth={200}
            minWidth={100}
            paneId="contentPane"
            isCollapsed={!!collapsedPanes.find(pane => pane === 'contentPane')}
          >
            <Pane
              title="Content"
              paneId="contentPane"
              isCollapsed={!!collapsedPanes.find(pane => pane === 'contentPane')}
              onExpand={this.handleShouldExpand}
              onCollapse={this.handleShouldCollapse}
            >
              <ul className={typePaneStyles.list}>
                {
                  TYPE_ITEMS.map((item, i) => {
                    return (
                      <li key={i} className={typePaneStyles.item}>
                        {this.renderTypePaneItem(item)}
                      </li>
                    )
                  })
                }
              </ul>
            </Pane>
          </SplitPaneWrapper>


          {
            schemaType && selectedType && (
              <SplitPaneWrapper
                defaultWidth={300}
                minWidth={100}
                paneId="documentsPane"
                isCollapsed={!!collapsedPanes.find(pane => pane === 'documentsPane')}
              >
                <DocumentsPane
                  isCollapsed={!!collapsedPanes.find(pane => pane === 'documentsPane')}
                  selectedType={selectedType}
                  selectedDocumentId={selectedDocumentId}
                  schemaType={schemaType}
                  router={this.props.router}
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
