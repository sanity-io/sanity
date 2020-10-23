const miss = require('mississippi')

const isDraft = (doc) => doc && doc._id && doc._id.indexOf('drafts.') === 0

module.exports = () =>
  miss.through.obj((doc, enc, callback) => {
    if (isDraft(doc)) {
      return callback()
    }

    return callback(null, doc)
  })
