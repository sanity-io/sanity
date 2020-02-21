const value = {
  foo: {
    bar: {
      test: 'hi'
    }
  },
  foobar: {

  }
}

const markers = {
  items: [],
  children: {
    foo: {
      items: [],
      children: {
        bar: {
          items: [{..}],
          children: {
            test: {
              items: [],
              children: {}
            }
          }
        }
      }
    },
    foobar: {
      items: [],
      children: {}
    }
  }
}

//patch(markers, {set: {'children.foo.markers'}})

// const markers = [{path: ['foo', 'bar'], markers: []}, {path: ['foo', 'bar']}, {path: ['foo', 'bar']}]
