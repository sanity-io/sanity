import {route} from 'sanity/router'

// eslint-disable-next-line camelcase
export const router = route.create('/', {__unsafe_disableScopedSearchParams: true}, [
  route.intents('/intent'),
  route.create(':type', [route.create(':id', [route.create(':path')])]),
])
