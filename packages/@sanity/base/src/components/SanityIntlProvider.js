import PropTypes from 'prop-types'
import React from 'react'
import {addLocaleData, IntlProvider} from 'part:@sanity/base/locale/intl'
import {IntlWrapper} from 'part:@sanity/base/locale/formatters'

import {resolveLanguage} from 'part:@sanity/base/language-resolver'
import messageFetcher from 'part:@sanity/base/locale-message-fetcher'
import Spinner from 'part:@sanity/components/loading/spinner'

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
        this.mountTimer = setTimeout(() => {
          this.setState({
            messages: localizedMessages,
            language: language
          })
        }, 0)
      }).catch(this.catchError)
    }).catch(this.catchError)
  }

  componentWillUnmount() {
    clearTimeout(this.mountTimer)
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
      return <Spinner fullscreen message="Loading locale messages..." />
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
  children: PropTypes.node,
  supportedLanguages: PropTypes.arrayOf(PropTypes.string)
}

export default SanityIntlProvider
