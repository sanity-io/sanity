import Observable from 'zen-observable'

function createProgressEvent(percent) {
  return {type: 'progress', stage: 'upload', percent: percent}
}
function simulateProgress() {
  return new Observable(observer => {
    let percent = 0
    let progressTimer = setTimeout(nextProgress, 0)

    function nextProgress() {
      observer.next(++percent)
      if (percent < 100) {
        progressTimer = setTimeout(nextProgress, Math.floor(Math.random() * 100))
      } else {
        observer.complete()
      }
    }

    return () => {
      if (percent < 100) {
        // upload cancelled
      }
      clearTimeout(progressTimer)
    }
  }).map(createProgressEvent)
}

const REFS_DB = []
function createReference(type, props) {
  const id = Math.random()
    .toString(32)
    .substring(2)
  REFS_DB.push({
    _id: id,
    _type: type,
    ...props
  })
  return {
    _ref: id
  }
}

function mockUpload(getBody) {
  return simulateProgress().flatMap(event => {
    const values = [
      event,
      event.percent === 100 && {
        type: 'complete',
        id: getBody()
      }
    ].filter(Boolean)
    return Observable.of(...values)
  })
}

function mockUploadImage(image) {
  return mockUpload(() => {
    return createReference('imageAsset', {
      url: image.previewUrl
    })
  })
}

function mockUploadFile(file) {
  return mockUpload(() => {
    return createReference('fileAsset', {
      url: URL.createObjectURL(file)
    })
  })
}

function mockMaterializeReference(id) {
  return Promise.resolve(REFS_DB.find(ref => ref._id == id))
}

export {mockUploadFile, mockUploadImage, mockMaterializeReference}
