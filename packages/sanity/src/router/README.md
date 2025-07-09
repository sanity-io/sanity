# `sanity/router`

## Features

Based on a routing schema:

- A state object can be derived from the current pathname
- A state object can be used to generate a path name

## API Usage

Define the routes for your application and how they should map to application state

```js
import {route} from 'sanity/router'

const router = route.create('/', [
  route.create('/products/:productId'),
  route.create('/users/:userId'),
  route('/:page'),
])

router.encode({})
// => '/'
router.decode('/')
// => {}

router.encode({productId: 54})
// => '/products/54'

router.decode('/products/54')
// => {productId: 54}

router.encode({userId: 22})
// => '/users/22'

router.decode('/users/54')
// => {userId: 54}

router.encode({page: 'about'})
// => '/about'

router.decode('/about')
// => {page: about}
```

## React usage

### Setup routes and provider

```jsx
import {route} from 'sanity/router'
import {RouterProvider, withRouter} from 'sanity/router'

const router = route('/', [route('/bikes/:bikeId')])

const history = createHistory()

function handleNavigate(nextUrl, {replace} = {}) {
  if (replace) {
    history.replace(nextUrl)
  } else {
    history.push(nextUrl)
  }
}

const App = withRouter(function App({router}) {
  if (router.state.bikeId) {
    return <BikePage id={router.state.bikeId} />
  }
  return (
    <div>
      <h1>Welcome</h1>
      <StateLink state={{bikeId: 22}}>Go to bike 22</StateLink>
    </div>
  )
})

function render(location) {
  ReactDOM.render(
    <RouterProvider
      router={router}
      onNavigate={handleNavigate}
      state={router.decode(location.pathname)}
    >
      <App />
    </RouterProvider>,
    document.getElementById('container'),
  )
}
history.listen(() => render(document.location))
```

## API

- `route(path : string, ?options : Options, ?children : ) : Router`
- `route.scope(name : string, path : string, ?options : Options, ?children : ) : Router`
- `Router`:

  - `encode(state : object) : string`
  - `decode(path : string) : object`
  - `isRoot(path : string) : boolean`
  - `getBasePath() : string`,
  - `isNotFound(pathname: string): boolean`
  - `getRedirectBase(pathname : string) : ?string`

- `RouteChildren`:
  ```
  Router | [Router] | ((state) => Router | [Router])
  ```
- `Options`:

  ```
  {
    path?: string,
    children?: RouteChildren,
    transform?: {[key: string] : Transform<*>},
    scope?: string
  }
  ```

  - `children` can be either another router returned from another `route()-call`, an array of routers or a function that gets passed the matched parameters, and conditionally returns child routes

## Limitations

- Parameterized paths _only_. Each route must have at least one unique parameter. If not, there's no way of unambiguously resolve a path from an empty state.

Consider the following routes:

```js
const router = route('/', [route('/about'), route('/contact')])
```

What route should be resolved from an empty state? Since both `/about` and `/contact` above resolves to an empty state object, there's no way to encode an empty state unambiguously back to either of them. The solution to this would be to introduce the page name as a parameter instead:

```js
const router = route('/', route('/:page'))
```

Now, `/about` would resolve to the state `{page: 'about'}` which unambiguously can map back to `/page`, and an empty state can map to `/`. To figure out if you are on the index page, you can check for `state.page == null`, (and set the state.page to null to navigate back to the index)

## Search params

URL search parameters will be decoded and made available on the special `_searchParams` key of the router state. This is which is an array of `[key: string, value: string]` tuples, similar to what you'd get from `URLSearchParams.entries()`.

URL search params will be scoped the same way as any path params, so when you're within a scope you don't need to worry about how your own search params fits in with the global environment. In the url, they will be namespaced with `/some/route?scope[param]=value`. Params in nested scopes will be `scopeA[scopeB][param]=value`.

Given the route `/path/to/:someParam`

#### Read search params

Given the url: `/path/to/something?foo=bar&bar=baz`

```ts
const router = useRouter()

console.log(router.state)
```

Will log

```ts
{
  someParam: 'something',
  _searchParams: [['foo', 'bar'], ['bar', 'baz']]
}
```

#### Navigate w/search params

```ts
const router = useRouter()

router.navigate({
  someParam: 'something',
  _searchParams: [
    ['foo', 'bar'],
    ['bar', 'baz'],
  ],
})
```

Will navigate to:

```
/path/to/something?foo=bar&bar=baz
```

### Transforming path parameters

Query parameters doesn't work too well with router scopes as they operate in a global namespace. A possible workaround is to "fake" query params in a path segment using transforms:

```js
function decodeParams(pathsegment) {
  return pathsegment.split(';').reduce((params, pair) => {
    const [key, value] = pair.split('=')
    params[key] = value
    return params
  }, {})
}
function encodeParams(params) {
  return Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join(';')
}

const router = route(
  '/some/:section/:settings',
  {
    transform: {
      settings: {
        toState: decodeParams,
        toPath: encodeParams,
      },
    },
  },
  route('/other/:page'),
)
```

This call...

```js
router.decode('/some/bar/width=full;view=details')
```

...will return the following state

```js
{
  section: 'bar',
  settings: {
    width: 'full',
    view: 'details',
  }
}
```

Conversely calling

```js
router.encode({
  section: 'bar',
  settings: {
    width: 'full',
    view: 'details',
  },
})
```

will return

```
/some/bar/width=full;view=details
```

## Scopes

A scope is a separate router state space, allowing different parts of an application to be completely agnostic about the overall routing schema is like. Let's illustrate:

```js
import {route} from './src'
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
```

Decoding the following path...

```js
router.decode('/apps/pokemon/stats/bulbasaur')
```

...will give us the state:

```js
{
  appName: 'pokemon',
  pokemon: {
    section: 'stats',
    pokemonName: 'bulbasaur'
  }
}
```

## Intents

An _intent_ is a kind of global route that can be used for dispatching user actions. The intent route can be mounted with

```js
route.intents(<basePath>)
```

Intent links bypasses scoping, and will always be mapped to the configured `basePath`.

An intent consists of a name, e.g. `open` and a set of parameters, e.g. `{id: 'abc33'}` and the easiest way to make a link to an intent is using the `IntentLink` React component:

```jsx
<IntentLink intent="open" params={{id: abc33}}>
  Open document
</IntentLink>
```

This will generate an `<a` tag with a href like `/<base path>/open/id=abc33` depending on where the intent handler is mounted

State router comes with a built in intent-route parser that decodes an intent route to route state.

Full example:

```
const router = route('/', [
  route('/users/:username'),
  route.intents('/intents') // <-- sets up intent routes at the /intents base path
])
```

Decoding the url `/intents/open/id=abc33` will produce the following state:

```js
{
  intent: 'open',
  params: {id: 'abc33'}
}
```

It is now up to your application logic to translate this intent into an action, and redirect accordingly.

## 404s

To check whether a path name matches, you can use the isNotFound method on the returned router instance:

```js
const router = route('/pages/:page')

router.isNotFound('/some/invalid/path')
// => true
```

## Base paths

Using a base path is as simple as adding a toplevel route with no params:

```js
const router = route('/some/basepath', [route('/:foo'), route('/:bar')])
```

Any empty router state will resolve to `/some/basepath`. To check if you should redirect to the base path on app init, you can use the `router.isRoot(path)` and `router.getBasePath()` method:

```js
if (router.isRoot(location.pathname)) {
  const basePath = router.getBasePath()
  if (basePath !== location.pathname) {
    history.replaceState(null, null, basePath)
  }
}
```

For convenience, this check is combined in the method `router.getRedirectBase()`, that if a redirect is needed, will return the base path, otherwise `null`

```js
const redirectTo = router.getRedirectBase(location.pathname)
if (redirectTo) {
  history.replaceState(null, null, redirectTo)
}
```

## License

MIT-licensed
