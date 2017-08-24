import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import pluginLoader from '@sanity/plugin-loader'

pluginLoader({
  overrides: {
    'config:sanity': [{api: {projectId: 'abc123', dataset: 'hei'}}]
  }
})

chai.should()
chai.use(chaiAsPromised)
