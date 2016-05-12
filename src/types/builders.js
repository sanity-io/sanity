import types from './'
import {createTypeBuilder} from './utils'

const typeNames = Object.keys(types)

const builders = {}
typeNames.forEach(typeName => {
  builders[typeName] = createTypeBuilder(types[typeName])
})

export default builders
