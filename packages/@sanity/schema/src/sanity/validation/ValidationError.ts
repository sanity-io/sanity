import {type SchemaValidationProblemGroup} from '@sanity/types'

export class ValidationError extends Error {
  public problems: SchemaValidationProblemGroup[]
  constructor(problems: SchemaValidationProblemGroup[]) {
    super('ValidationError')
    this.problems = problems
    this.name = 'ValidationError'
  }
}
