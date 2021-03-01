import {createScope} from './createScope'

export {createScope}

const {Tracker, useReporter, useReportedValues} = createScope()

export {Tracker, useReporter, useReportedValues}

export type Reported<Value> = [string, Value]
