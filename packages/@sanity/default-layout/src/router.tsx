// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import config from 'config:sanity'
import {route} from '@sanity/base/router'
import {CONFIGURED_SPACES, HAS_SPACES} from './util/spaces'
import {getRegisteredTools} from './util/getRegisteredTools'

const tools = getRegisteredTools()
const basePath = ((config.project && config.project.basePath) || '').replace(/\/+$/, '')

const toolRoute = route.create('/:tool', (toolParams: any) => {
  const foundTool = tools.find((current) => current.name === toolParams.tool)
  return foundTool ? (route as any).scope(foundTool.name, '/', foundTool.router) : route.create('/')
})

const spaceRoute = route.create('/:space', ((params: any) => {
  const foundSpace = CONFIGURED_SPACES.find((sp) => sp.name === params.space)
  return foundSpace ? toolRoute : route.create('/')
}) as any)

const rootRouter = route.create(`${basePath}/`, [
  (route as any).intents('/intent'),
  HAS_SPACES ? spaceRoute : toolRoute,
])

export function maybeRedirectToBase() {
  const redirectTo = rootRouter.getRedirectBase(location.pathname)
  if (redirectTo) {
    history.replaceState(null, null, redirectTo)
  }
}

export default rootRouter
