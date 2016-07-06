import request from '@sanity/request'
import pluginConfig from 'config:@sanity/default-login'

const getInstallationUrl = `${pluginConfig.defaultLogin.host}/api/sanction/v1/installations`

export default {
  getInstallation: label => {
    return new Promise((resolve, reject) => {
      request({
        url: `${getInstallationUrl}/${label}`,
        withCredentials: false
      }, (err, res, body) => {
        let json
        if (body) {
          json = JSON.parse(body)
        }
        if (!err && json && res.statusCode === 200) {
          return resolve(json)
        }
        if (json && json.error) {
          return reject(json.error)
        }
        return reject(err)
      })
    })
  }

}
