import {getBaseServer, applyStaticRoutes} from './baseServer'

export default function getProdServer(config) {
  return applyStaticRoutes(getBaseServer(config), config)
}
