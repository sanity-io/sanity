import tools from 'all:part:@sanity/base/tool'
import {project} from 'config:sanity'
import {route} from 'part:@sanity/base/router'
import {CONFIGURED_SPACES, HAS_SPACES} from './util/spaces'

const basePath = ((project && project.basePath) || '').replace(/\/+$/, '')

const toolRoute = route('/:tool', toolParams => {
  const foundTool = tools.find(current => current.name === toolParams.tool)
  return foundTool ? route.scope(foundTool.name, '/', foundTool.router) : route('/')
})

const spaceRoute = route('/:space', params => {
  const foundSpace = CONFIGURED_SPACES.find(sp => sp.name === params.space)
  return foundSpace ? toolRoute : route('/')
})

const rootRouter = route(`${basePath}/`, [
  route.intents('/intent'),
  HAS_SPACES ? spaceRoute : toolRoute
])

export function maybeRedirectToBase() {
  const redirectTo = rootRouter.getRedirectBase(location.pathname)
  if (redirectTo) {
    history.replaceState(null, null, redirectTo)
  }
}

export default rootRouter
