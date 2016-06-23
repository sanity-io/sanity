let loadingPromise = null

function loadGoogleMapsApi(props) {
  const callbackName = '___sanity_googleMapsApiCallback'
  const selectedLocale = props.locale || 'en-US'
  const apiKey = props.apiKey

  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps)
  }

  if (window[callbackName]) {
    return loadingPromise
  }

  loadingPromise = new Promise((resolve, reject) => {
    window[callbackName] = () => {
      delete window[callbackName]
      resolve(window.google.maps)
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}&language=${selectedLocale}`
    document.getElementsByTagName('head')[0].appendChild(script)
  })

  return loadingPromise
}

export default loadGoogleMapsApi
