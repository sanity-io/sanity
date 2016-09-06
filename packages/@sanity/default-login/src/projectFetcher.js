import request from '@sanity/request'
import pluginConfig from 'config:@sanity/default-login'

const getProjectUrl = `${pluginConfig.defaultLogin.host}/api/sanction/v1/project`

export default {
  getProject: label => {
    return new Promise((resolve, reject) => {
      request({
        url: `${getProjectUrl}/${label}`,
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
