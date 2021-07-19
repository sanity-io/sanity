const qs = require('querystring')
import {axiosObservable} from '../utils/axiosObservable'

export function callApi(method: string, token: string, args: object) {
  // can't invite self, so leave instead
  return axiosObservable<any>({
    method: 'get',
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
    },
    url: `https://slack.com/api/${method}?${qs.stringify({token, ...args})}`,
  })
}

type SlackResponse = any

export function callApiPost(method: string, token: string, args: object) {
  // can't invite self, so leave instead
  return axiosObservable<SlackResponse>({
    method: 'post',
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      Authorization: `Bearer ${token}`,
    },
    url: `https://slack.com/api/${method}`,
    data: args,
  })
}
