function progressStepper(onProgress, options) {
  let current = -1

  // Stepper function which increments progress up to defined total and returns
  // input argument verbatim so it may be used in the middle of a promise chain
  const step = inp => {
    onProgress({
      step: options.step,
      total: options.total,
      current: Math.min(++current, options.total)
    })

    return inp
  }

  step()
  return step
}

module.exports = progressStepper
