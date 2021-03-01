import React from 'react'
import {selectedLanguages$, setLangs} from './datastore'
import SelectLanguage from './SelectLanguage'
import config from 'part:@sanity/language-filter/config'

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
        selected={selected}
        onChange={setLangs}
      />
    )
  }
}
