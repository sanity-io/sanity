import {Path} from '../paths'

export interface ValidationError {
  message: string
  children?: ValidationError[]
  operation?: 'AND' | 'OR'
  paths: Path[]
  cloneWithMessage(message: string): ValidationError
}
