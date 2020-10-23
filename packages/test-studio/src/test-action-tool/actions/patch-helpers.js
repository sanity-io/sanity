function patch(p) {
  return p
}
export function setIfMissing(path, value) {
  return patch({
    setIfMissing: {
      [path]: value,
    },
  })
}
export function set(path, value) {
  return {
    set: {
      [path]: value,
    },
  }
}

export function append(path, items) {
  return patch({
    insert: {
      after: `${path}[-1]`,
      items: items,
    },
  })
}

export function unset(paths) {
  return patch({
    unset: paths,
  })
}
