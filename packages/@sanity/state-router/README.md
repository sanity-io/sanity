## @sanity/state-router

## Features
Based on a routing schema:
- A state object can be derived from the current pathname
- A state object can be used to generate a path name

## Usage

Define the routes for your application and how they should map to application state
```js
import {createRoute, resolvePathFromState, resolveStateFromPath} from 'xroute'

const route = createRoute('/*', [
  createRoute('/products/:productId'),
  createRoute('/users/:userId'),
  createRoute('/:page'),
])

resolvePathFromState(route, {})
// => '/'
resolveStateFromPath(route, '/')
// => {}

resolvePathFromState(route, {productId: 54})
// => '/products/54'

resolveStateFromPath(route, '/products/54')
// => {productId: 54}

resolvePathFromState(route, {userId: 22})
// => '/users/22'

resolveStateFromPath(route, '/users/54')
// => {userId: 54}

resolvePathFromState(route, {page: 'about'})
// => '/about'

resolveStateFromPath(route, '/about')
// => {page: about}

```

## Restrictions
- Parameterized paths *only*. Each route must have at least one unique parameter. If not, there's no way of unambiguously resolve a path from an empty state.

Consider the following routes:
```js
const rootRoute = createRoute('/', [
  createRoute('/about'),
  createRoute('/contact')
])
```
What route should be resolved from an empty state? Since both `/about` and `/contact` above resolves to an empty state object, there's no way to resolve an empty state object back to either of them. The solution to this would be to introduce the page name as a parameter instead:

```js
const rootRoute = createRoute('/:page')
```

Now, `/about` would resolve to the state `{page: 'about'}` which unambiguously can map back to `/page`, and an empty state can map to `/`. To figure out if you are on the index page, you can check for `state.page == null`, (and set the state.page to null to navigate back to the index)