import React, {PropTypes} from 'react'
import loadGoogleMapsApi from './loadGoogleMapsApi'

class GoogleMapsLoadProxy extends React.Component {
  static propTypes = {
    component: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props)

    this.state = {
      loading: true,
      error: null
    }
  }

  componentDidMount() {
    loadGoogleMapsApi(this.props)
      .then(api => this.setState({loading: false, api}))
      .catch(err => this.setState({error: err}))
  }

  render() {
    const {error, loading, api} = this.state
    if (error) {
      return <div>Load error: {error.stack}</div>
    }

    if (loading) {
      return <div>Loading Google Maps API</div>
    }

    const GeopointSelect = this.props.component

    return <GeopointSelect {...this.props} api={api} />
  }
}

export default GoogleMapsLoadProxy
