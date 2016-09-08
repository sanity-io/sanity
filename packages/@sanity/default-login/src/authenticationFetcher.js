import request from '@sanity/request'
import pluginConfig from 'config:@sanity/default-login'

const getCurrentUserUrl = `${pluginConfig.defaultLogin.host}/users/me`
const getProvidersUrl = `${pluginConfig.defaultLogin.host}/auth/providers`
const logoutUrl = `${pluginConfig.defaultLogin.host}/auth/logout`

export default {
  getProviders: () => {
    return new Promise((resolve, reject) => {
      request({
        url: getProvidersUrl,
        json: true,
        withCredentials: true
      }, (err, res, body) => {
        if (err) {
          return reject(err)
        }
        if (res.statusCode === 200) {
          return resolve(body.providers)
        }
        return reject(new Error(JSON.stringify(body)))
      })
    })
  },
  getCurrentUser: () => {
    return new Promise((resolve, reject) => {
      request({
        url: getCurrentUserUrl,
        json: true,
        withCredentials: true
      }, (err, res, body) => {
        if (!err && res.statusCode === 200) {
          if (err) {
            return reject(err)
          }
          if (Object.keys(body).length === 0 && body.constructor === Object) {
            return resolve(null)
          } else {
            return resolve(body)
          }
        }
        return reject(new Error(JSON.stringify(body)))
      })
    })
  },
  logout: () => {
    return new Promise((resolve, reject) => {
      request({
        url: logoutUrl,
        withCredentials: true,
        json: true
      }, (err, res, body) => {
        if (err) {
          return reject(err)
        }
        if (res.statusCode === 200) {
          return resolve()
        }
        return reject(new Error(JSON.stringify(body)))
      })
    })
  }

}
