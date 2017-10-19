export default (comp, opts, key) => {
  return comp.context.client.observable.request(opts).subscribe({
    next: val => comp.setState({[key]: val}),
    error: error => comp.setState({error})
  })
}
