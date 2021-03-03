import React from 'react'
import config from 'part:@sanity/language-filter/config'
import {selectedLanguages$, setLangs} from './datastore'
import SelectLanguage from './SelectLanguage'

export default class SelectLanguageProvider extends React.Component {
  state = {selected: []}

  componentDidMount(props) {
    this.subscription = selectedLanguages$.subscribe((selected) => {
      this.setState({selected: selected})
    })
  }
  componentWillUnmount(props) {
    this.subscription.unsubscribe()
  }

  render() {
    const {selected} = this.state
    return (
      <SelectLanguage
        languages={config.supportedLanguages}
        defaultLanguages={config.defaultLanguages}
        selected={selected}
        onChange={setLangs}
      />
    )
  }
}
