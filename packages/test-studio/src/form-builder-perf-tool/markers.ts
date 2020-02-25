const document = {
  foo: {
    bar: {
      test: 'hi'
    }
  },
  foobar: {}
}

const presence = []
const validation = []
const comments = []

const markers = {
  props: {
    presence,
    validation,
    comments
  },
  children: {
    foo: {
      props: {
        presence,
        validation,
        comments
      },
      children: {
        bar: {
          props: {
            presence,
            validation,
            comments
          },
          children: {
            test: {
              props: {
                presence,
                validation,
                comments
              },
              children: {}
            }
          }
        }
      }
    },
    foobar: {
      props: {
        presence,
        validation,
        comments
      },
      children: {}
    }
  }
}

//patch(markers, {set: {'children.foo.markers'}})

// const markers = [{path: ['foo', 'bar'], markers: []}, {path: ['foo', 'bar']}, {path: ['foo', 'bar']}]

export {}
