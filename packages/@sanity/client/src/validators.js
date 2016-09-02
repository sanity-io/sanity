exports.dataset = name => {
  if (!/^[-\w]{1,128}$/.test(name)) {
    throw new Error('Datasets can only contain lowercase characters, numbers, underscores and dashes')
  }
}

exports.projectId = id => {
  if (!/^[-a-z0-9]+$/i.test(id)) {
    throw new Error('`projectId` can only contain only a-z, 0-9 and dashes')
  }
}
