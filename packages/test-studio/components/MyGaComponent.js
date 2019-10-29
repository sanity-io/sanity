/* global gapi */
import React from 'react'
import {GoogleProvider, GoogleDataChart} from 'react-analytics-widget'
import { withDocument } from 'part:@sanity/form-builder';
import debounceRender from 'react-debounce-render';
import { Config } from '@jest/types';
import Spinner from 'part:@sanity/components/loading/spinner'

const CLIENT_ID = '678977866327-r49q4q23spt8rhhh8tmt0774b131mj9a.apps.googleusercontent.com'

const initGoogleAPI = () => {
  // eslint-disable-next-line max-params
  // Check that the google api is not initialized before
  if (typeof window !== 'undefined' && typeof gapi === 'undefined') {
    // eslint-disable-next-line max-params
    ;(function(w, d, s, g, js, fjs) {
      g = w.gapi || (w.gapi = {})
      g.analytics = {
        q: [],
        ready(cb) {
          this.q.push(cb)
        }
      }
      js = d.createElement(s)
      fjs = d.getElementsByTagName(s)[0]
      js.src = 'https://apis.google.com/js/platform.js'
      fjs.parentNode.insertBefore(js, fjs)
      js.onload = function() {
        g.load('analytics')
      }
    })(window, document, 'script')
  }
}

const views = {
  query: {
    ids: 'ga:122501362'
  }
}

class MyGaComponent extends React.PureComponent {
  componentDidMount() {
    initGoogleAPI()
  }
  render() {
    const {type = {}, document} = this.props
    const {options = {}} = type
    const {gaConfig} = options
    if (typeof window == 'undefined') {
      return <Spinner>Loading</Spinner>
    }
    if (typeof gapi !== 'undefined' && gaConfig(document)) {
      return (
        <GoogleProvider clientId={CLIENT_ID}>
           <GoogleDataChart views={views} config={options.gaConfig(document)} />
        </GoogleProvider>
      )
    }
    return <Spinner>Initializing</Spinner>
  }
}

// Debounce to avoid excessive requests to the google API
export default withDocument(debounceRender(MyGaComponent, 1000))
