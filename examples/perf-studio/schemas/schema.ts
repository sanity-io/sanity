import createSchema from 'part:@sanity/base/schema-creator'
import schemaTypes from 'all:part:@sanity/base/schema-type'
import {deeplyNestedObject, typingPerf, deeplyNestedObjectTest} from './cases/typingSpeed/doc'
import {typingPerfRun} from './cases/typingSpeed/result'
import {cpu, instance} from './instance'

export default createSchema({
  name: 'test-examples',
  types: schemaTypes.concat([
    typingPerf,
    typingPerfRun,
    instance,
    cpu,
    deeplyNestedObjectTest,
    deeplyNestedObject,
  ]),
})
