import {getBaseServer, applyStaticRoutes} from './baseServer'

export default function getProdServer() {
  return applyStaticRoutes(getBaseServer())
}
