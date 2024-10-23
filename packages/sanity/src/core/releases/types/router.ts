import {type RouterState} from 'sanity/router'

export interface ReleasesRouterState extends RouterState {
  releaseId?: string
}
