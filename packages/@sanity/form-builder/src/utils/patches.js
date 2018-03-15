// @flow

export function setIfMissing(value: any, path: Path = []): SetIfMissingPatch {
  return {
    type: 'setIfMissing',
    path,
    value
  }
}

export function insert(items: any[], position: InsertPosition, path: Path = []): InsertPatch {
  return {
    type: 'insert',
    path,
    position,
    items
  }
}

export function set(value: any, path: Path = []): SetPatch {
  return {type: 'set', path, value}
}

export function unset(path: Path = []): UnsetPatch {
  return {type: 'unset', path}
}

export function prefixPath<T: HasPath>(patch: T, segment: PathSegment): T {
  return {
    ...patch,
    path: [segment, ...patch.path]
  }
}
