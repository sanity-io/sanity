import React from 'react'
import {addLocaleData, IntlProvider} from 'component:@sanity/base/locale/intl'
import {IntlWrapper} from 'role:@sanity/base/locale/formatters'

import {resolveLanguage} from 'machine:@sanity/base/language-resolver'
import messageFetcher from 'machine:@sanity/base/locale-message-fetcher'

class SanityIntlProvider extends React.Component {

  constructor(props) {
    super(props)

    this.catchError = this.catchError.bind(this)
    this.state = {
      messages: null,
      language: null,
      error: null
    }
  }

  catchError(err) {
    console.error(err) // eslint-disable-line no-console
    this.setState({error: err})
  }

  componentDidMount() {
    const {supportedLanguages} = this.props
    resolveLanguage(supportedLanguages).then(language => {
      messageFetcher.fetchLocalizedMessages(language).then(localizedMessages => {
        const languagePrefix = language.split('-')[0]
        const localeData = require(`react-intl/locale-data/${languagePrefix}`)
        addLocaleData(localeData)

        // In order to get a proper stacktrace on rendering errors,
        // we need to move this out of the current call stack
        setTimeout(() => {
          this.setState({
            messages: localizedMessages,
            language: language
          })
        }, 0)
      }).catch(this.catchError)
    }).catch(this.catchError)
  }

  render() {
    const {messages, language, error} = this.state
    if (error) {
      return (
        <div>
          <h2>Error fetching locale data</h2>
          <code><pre>{error.stack}</pre></code>
        </div>
      )
    }

    if (!messages) {
      return <div>Loading locale messages...</div>
    }

    return (
      <IntlProvider locale={language} messages={messages}>
        <IntlWrapper>
          {this.props.children}
        </IntlWrapper>
      </IntlProvider>
    )
  }
}

SanityIntlProvider.propTypes = {
  children: React.PropTypes.node,
  supportedLanguages: React.PropTypes.arrayOf(React.PropTypes.string)
}

export default SanityIntlProvider
