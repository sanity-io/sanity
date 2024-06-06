import {type Path} from 'sanity'

/**
 * @internal
 * Check if a path has an exception based on the list of exceptions in the config
 */
export function hasException(path: Path, exceptions: string[]): boolean {
  return path.some((segment) => exceptions.find((exception) => exception === segment))
}
