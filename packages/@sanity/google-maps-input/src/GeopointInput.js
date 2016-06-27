import React, {PropTypes} from 'react'
import config from 'config:@sanity/google-maps-input'
import GoogleMapsLoadProxy from './GoogleMapsLoadProxy'
import GeopointSelect from './GeopointSelect'
import {intlShape} from 'component:@sanity/base/locale/intl'
import {formatMessage} from 'role:@sanity/base/locale/formatters'

class GeopointInput extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.shape({
      lat: PropTypes.number,
      lng: PropTypes.number
    })
  };

  static contextTypes = {
    intl: intlShape
  };

  constructor() {
    super()

    this.handleToggleModal = this.handleToggleModal.bind(this)

    this.state = {
      dragMarkerInitialPosition: null,
      modalOpen: false
    }
  }

  handleToggleModal() {
    this.setState({modalOpen: !this.state.modalOpen})
  }

  getStaticImageUrl(value) {
    const loc = `${value.lat},${value.lng}`
    const params = {
      key: config.apiKey,
      center: loc,
      markers: loc,
      zoom: 13,
      size: '700x200'
    }

    const qs = Object.keys(params).reduce((res, param) => {
      return res.concat(`${param}=${encodeURIComponent(params[param])}`)
    }, [])

    return `https://maps.googleapis.com/maps/api/staticmap?${qs.join('&')}`
  }

  render() {
    const {value} = this.props

    if (!config || !config.apiKey) {
      return (
        <div>
          <p>API key for Google Maps is not defined. This plugin needs API access to:</p>
          <ul>
            <li>Google Maps JavaScript API</li>
            <li>Google Places API Web Service</li>
            <li>Google Static Maps API</li>
          </ul>
          <p>
            Please define an API key with access to these services in
            <code style={{whitespace: 'nowrap'}}>`&lt;project-root&gt;/config/google-maps.json`</code>
          </p>
        </div>
      )
    }

    return (
      <div className="form-builder__field form-builder__latlng">

        <label className="form-builder__label">
          {this.props.title}
        </label>

        {this.props.description
          && <div className="form-builder__help-text">{this.props.description}</div>
        }

        <div className="form-builder__item">

          {value && <div><img src={this.getStaticImageUrl(value)} /></div>}

          <button type="button" onClick={this.handleToggleModal}>
            {formatMessage(value
              ? 'google-maps.button.edit'
              : 'google-maps.button.setLocation'
            )}
          </button>

          {value && (
            <button type="button">
              {formatMessage('google-maps.button.remove')}
            </button>
          )}

          {this.state.modalOpen && (
            <div className="modal modal--map">
              <h1>{formatMessage('google-maps.placeOnMap')}</h1>
              <p>{formatMessage('google-maps.mapHelpText')}</p>

              <GoogleMapsLoadProxy
                value={value}
                apiKey={config.apiKey}
                onChange={this.props.onChange}
                defaultLocation={config.defaultLocation}
                defaultZoom={config.defaultZoom}
                locale={this.context.intl.locale}
                component={GeopointSelect}
              />

              <div className="modal-buttons">
                <button className="primary" onClick={this.handleToggleModal}>
                  {formatMessage('google-maps.button.done')}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    )
  }
}

export default GeopointInput
