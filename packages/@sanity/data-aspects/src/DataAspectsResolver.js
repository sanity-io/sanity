import config from 'config:@sanity/data-aspects'

class DataAspectsResolver {

  rawConfig() {
    const conf = config || {empty: true}
    return `Here, have some config. ${JSON.stringify(conf)}`
  }
}

export default DataAspectsResolver
