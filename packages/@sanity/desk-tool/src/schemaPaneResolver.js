import React, {PropTypes} from 'react'
import Pane from 'component:desk-tool/pane'
import QueryPane from 'component:desk-tool/query-pane'
import schema from 'schema:@sanity/base/schema'
import PaneContainer from 'component:desk-tool/pane-container'
import FormBuilderContainer from 'role:@sanity/form-builder/container'
import styles from '../styles/DeskTool.css'
import DataAspectsResolver from 'role:@sanity/data-aspects/resolver'
const dataAspects = new DataAspectsResolver(schema)


function getTypeItems() {
  return dataAspects.getInferredTypes().map(type => ({
    pathSegment: type.name,
    title: type.name.substr(0, 1).toUpperCase() + type.name.substr(1)
  }))
}


class SchemaPaneResolver extends React.Component {

  shouldComponentUpdate(nextProps) {
    return this.props.location !== nextProps.location
  }

  parseLocation() {
    const segments = this.props.location.split('/').slice(1)
    let selectedType = segments[0]
    let selectedItem = segments[1]
    if (selectedType && !dataAspects.getType(selectedType)) {
      selectedType = null
      selectedItem = null
    }
    return {segments, selectedType, selectedItem}
  }

  render() {
    const {segments, selectedType, selectedItem} = this.parseLocation()
    const typeItems = getTypeItems()

    const panes = [
      <Pane
        key="types"
        items={typeItems}
        activeItem={selectedType}
      />
    ]

    if (selectedType) {
      const queryOpts = {
        typeName: selectedType,
        keyForId: 'pathSegment',
        keyForDisplayFieldName: 'title'
      }
      const selectedTypeQuery = dataAspects.getListQuery(queryOpts)
      console.log('query:', selectedTypeQuery)

      panes.push(
        <QueryPane
          key={selectedType}
          basePath={`/${selectedType}`}
          segments={segments}
          query={selectedTypeQuery}
          activeItem={selectedItem}
          previousPathSegment={selectedType}
        />
      )
    }

    const editor = selectedItem && (
      <FormBuilderContainer
        documentId={selectedItem}
        typeName={selectedType}
      />
    )

    return (
      <div className={styles.container}>
        <PaneContainer className={styles.paneContainer}>
          {panes}
        </PaneContainer>
        <main className={styles.main}>
          {editor}
        </main>
      </div>
    )
  }
}

SchemaPaneResolver.propTypes = {
  location: PropTypes.string.isRequired
}

export default SchemaPaneResolver
