import assert from 'assert'
import {route} from './src/route'

function findAppByName(name: unknown) {
  return (
    name === 'pokemon' && {
      name: 'pokemon',
      router: route.create('/:section', route.create('/:pokemonName')),
    }
  )
}

const router = route.create('/', [
  route.create('/users/:username'),
  route.create('/apps/:appName', (params) => {
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
