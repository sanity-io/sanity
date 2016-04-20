import locationStore from 'datastore:@sanity/base/location'

function slicePathAndTool(event) {
  const [, site, tool, ...rest] = event.location.pathname.split('/')
  return Object.assign({}, event, {
    site,
    tool,
    location: event.location.extend({pathname: rest.join('/')})
  })
}
function stripPathAndTool(event) {
  const [/*leading slash*/, /*site*/, /*tool*/, ...rest] = event.location.pathname.split('/')
  return Object.assign({}, event, {
    location: event.location.extend({pathname: `/${rest.join('/')}`})
  })
}

function createToolLocationStore() {
  return Object.assign({}, locationStore, {
    state: locationStore.state.map(stripPathAndTool),
    urlTo(path) {
      return locationStore.state.map(slicePathAndTool).map(event => {
        return `/${[event.site, event.tool, ...(path.split('/'))].filter(Boolean).join('/')}`
      })
    }
  })
}

export default createToolLocationStore()
