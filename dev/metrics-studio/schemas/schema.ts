import createSchema from 'part:@sanity/base/schema-creator'
import schemaTypes from 'all:part:@sanity/base/schema-type'
import {deeplyNestedObject, typingPerf} from './cases/typingSpeed/doc'
import {typingPerfRun, typingSpeedSummary} from './cases/typingSpeed/result'
import {cpu, hardwareProfile, instance} from './common/types'

export default createSchema({
  name: 'test-examples',
  types: schemaTypes.concat([
    typingPerf,
    typingPerfRun,
    typingSpeedSummary,
    instance,
    cpu,
    deeplyNestedObject,
    hardwareProfile,
  ]),
})
