import {type Sourced} from './types'

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export async function toSourced<Data>(load: () => Promise<Data>): Promise<Sourced<Data>> {
  try {
    return {status: 'ok', data: await load()}
  } catch (error) {
    return {status: 'unavailable', error: errorMessage(error)}
  }
}

export function mapSourced<Input, Output>(
  sourced: Sourced<Input>,
  transform: (data: Input) => Output,
): Sourced<Output> {
  return sourced.status === 'ok' ? {status: 'ok', data: transform(sourced.data)} : sourced
}
