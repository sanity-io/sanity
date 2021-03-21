import React from 'react'
import config from 'part:@sanity/language-filter/config'
import {selectedLanguages$, setLangs} from './datastore'
import SelectLanguage from './SelectLanguage'

export default class SelectLanguageProvider extends React.Component {
  state = {
    selected: [],
  }

  componentDidMount() {
    this.subscription = selectedLanguages$.subscribe((selected) => {
      this.setState({
        selected: selected,
      })
    })
  }
  componentWillUnmount() {
    this.subscription.unsubscribe()
  }

  render() {
    const {selected} = this.state
    const currentDocumentType = this.props.schemaType?.name
    return (
      <SelectLanguage
        languages={config.supportedLanguages}
        defaultLanguages={config.defaultLanguages}
        documentTypes={config.documentTypes}
        currentDocumentType={currentDocumentType}
        selected={selected}
        onChange={setLangs}
      />
    )
  }
}
