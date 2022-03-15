import {route, Router} from '@sanity/state-router'
import {SanityTool} from '../../config'

export function createRouter(opts: {
  basePath?: string
  spaces: string[]
  tools: SanityTool[]
}): Router {
  const {basePath = '', spaces, tools} = opts

  const toolRoute = route.create('/:tool', (toolParams) => {
    const tool = tools.find((current) => current.name === toolParams.tool)

    return tool ? route.scope(tool.name, '/', tool.router) : route.create('/')
  })

  const spaceRoute = route.create('/:space', (params) => {
    const foundSpace = spaces.length > 0 && spaces.find((sp) => sp === params.space)

    return foundSpace ? toolRoute : route.create('/')
  })

  const router = route.create(`${basePath}/`, [
    route.intents('/intent'),
    spaces.length > 0 ? spaceRoute : toolRoute,
  ])

  // export function maybeRedirectToBase() {
  //   const redirectTo = router.getRedirectBase(location.pathname)
  //   if (redirectTo) {
  //     history.replaceState(null, null, redirectTo)
  //   }
  // }

  return router
}
