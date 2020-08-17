import config from 'config:@sanity/google-maps-input'

const locale = (typeof window !== 'undefined' && window.navigator.language) || 'en'

let loadingPromise: Promise<typeof window.google.maps>

export function loadGoogleMapsApi(): Promise<typeof window.google.maps> {
  const callbackName = '___sanity_googleMapsApiCallback'
  const selectedLocale = locale || 'en-US'

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
    script.onerror = reject
    script.src = `https://maps.googleapis.com/maps/api/js?key=${config.apiKey}&libraries=places&callback=${callbackName}&language=${selectedLocale}`
    document.getElementsByTagName('head')[0].appendChild(script)
  })

  return loadingPromise
}
