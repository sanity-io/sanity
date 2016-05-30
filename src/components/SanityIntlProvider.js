import React from 'react'
import {addLocaleData, IntlProvider} from 'component:@sanity/base/locale/intl'

import {resolveLanguage} from 'machine:@sanity/base/language-resolver'
import messageFetcher from 'machine:@sanity/base/locale-message-fetcher'

class SanityIntlProvider extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      messages: null,
      language: null
    }
  }


  componentDidMount() {
    const {supportedLanguages} = this.props
    resolveLanguage(supportedLanguages).then(language => {
      messageFetcher.fetchLocalizedMessages(language).then(localizedMessages => {
        const languagePrefix = language.split('-')[0]
        const localeData = require(`react-intl/locale-data/${languagePrefix}`)
        addLocaleData(localeData)

        this.setState({
          messages: localizedMessages,
          language: language
        })
      })
    })
  }


  render() {
    const {messages, language} = this.state
    if (!messages) {
      return <div>Loading locale messages...</div>
    }

    return (
      <IntlProvider locale={language} messages={messages}>
        {this.props.children}
      </IntlProvider>
    )
  }
}

SanityIntlProvider.propTypes = {
  children: React.PropTypes.node,
  supportedLanguages: React.PropTypes.arrayOf(React.PropTypes.string)
}

export default SanityIntlProvider
