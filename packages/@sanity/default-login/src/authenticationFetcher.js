import request from '@sanity/request'
import pluginConfig from 'config:@sanity/default-login'

const getCurrentUserUrl = `${pluginConfig.defaultLogin.host}/api/sanction/v1/users/me`
const getTokenUrl = `${pluginConfig.defaultLogin.host}/api/sanction/v1/users/me/token`
const logoutUrl = `${pluginConfig.defaultLogin.host}/api/sanction/v1/users/logout`

export default {
  getCurrentUser: () => {
    return new Promise((resolve, reject) => {
      request({
        url: getCurrentUserUrl,
        withCredentials: true
      }, (err, res, body) => {
        let json
        if (body) {
          json = JSON.parse(body)
        }
        if (!err && json && res.statusCode === 200) {
          return resolve(json)
        }
        if (json && json.error) {
          if (json.error.code === 'NO_CURRENT_USER') {
            return resolve(null)
          }
          return reject(json.error)
        }
        return reject(err)
      })
    })
  },
  getToken: () => {
    return new Promise((resolve, reject) => {
      request({
        url: getTokenUrl,
        withCredentials: true
      }, (err, res, body) => {
        let json
        if (body) {
          json = JSON.parse(body)
        }
        if (!err && json && res.statusCode === 200) {
          return resolve(json.token)
        }
        if (json && json.error) {
          return reject(json.error)
        }
        return reject(err)
      })
    })
  },
  logout: () => {
    return new Promise((resolve, reject) => {
      request({
        url: logoutUrl,
        withCredentials: true
      }, (err, res, body) => {
        let json
        if (body) {
          json = JSON.parse(body)
        }
        if (!err && res.statusCode === 200) {
          return resolve()
        }
        if (json && json.error) {
          return reject(json.error)
        }
        return reject(err)
      })
    })
  }

}
