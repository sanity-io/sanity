import locationStore from 'datastore:@sanity/base/location'

const currentPath = locationStore.state.map(event => {
  const [, site, tool, ...rest] = event.location.pathname.split('/')
  return {
    type: event.type,
    route: rest.join('/'),
    site,
    tool
  }
})

function createRouter() {
  return {
    route: currentPath.map(event => {
      return {
        type: event.type,
        route: event.route
      }
    }),
    urlTo(path) {
      return currentPath.map(({site, tool}) => {
        return `/${[site, tool, ...(path.split('/'))].filter(Boolean).join('/')}`
      })
    }
  }
}

export default createRouter()
