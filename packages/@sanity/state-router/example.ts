import {route} from './src'
import assert from 'assert'

function findAppByName(name) {
  return (
    name === 'pokemon' && {
      name: 'pokemon',
      router: route('/:section', route('/:pokemonName')),
    }
  )
}

const router = route('/', [
  route('/users/:username'),
  route('/apps/:appName', (params) => {
    const app = findAppByName(params.appName)
    return app && route.scope(app.name, '/', app.router)
  }),
])
// Decoding the following path with
router.decode('/apps/pokemon/stats/bulbasaur')
// ...we get the state:
assert.deepEqual(router.decode('/apps/pokemon/stats/bulbasaur'), {
  appName: 'pokemon',
  pokemon: {
    section: 'stats',
    pokemonName: 'bulbasaur',
  },
})
