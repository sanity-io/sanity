/* eslint-disable max-len, react/display-name, react/no-multi-comp */
import {route, StateLink} from 'part:@sanity/base/router'
import PropTypes from 'prop-types'
import React from 'react'

class WithRouterState extends React.Component {
  static propTypes = {
    children: PropTypes.func
  }
  static contextTypes = {
    router: PropTypes.object
  }

  render() {
    const {state} = this.context.router
    return this.props.children(state)
  }
}

const toolStyle = {
  backgroundColor: 'green',
  border: '10px solid red',
  position: 'absolute',
  boxSizing: 'border-box',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%'
}

function MyOtherTool(props) {
  return (
    <div style={toolStyle}>
      <h2>Other Tool, I can have router state</h2>
      <WithRouterState>
        {state => (
          <div>
            This is my state:
            <pre>{JSON.stringify(state)}</pre>
          </div>
        )}
      </WithRouterState>
      <p>
        <StateLink toIndex>Go to index</StateLink>
      </p>
      <p>
        <StateLink state={{foo: 'bar', rand: Math.random()}}>Click me</StateLink>
      </p>
      <div>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed odio lacus, sodales id rhoncus
        dictum, consectetur sed mi. Fusce gravida est ante, nec sodales nibh vestibulum eu. Proin
        tortor tortor, facilisis quis orci vitae, venenatis tempus dolor. Aenean hendrerit, ex
        venenatis ornare pellentesque, urna justo fermentum dui, ut euismod tortor quam ut urna.
        Quisque et blandit arcu. Ut sit amet metus quis erat molestie rutrum et ut purus. Curabitur
        eleifend quam aliquet metus vulputate, sit amet commodo massa posuere. Etiam id urna sit
        amet massa lacinia vulputate at nec felis. Proin consequat vitae ipsum quis euismod.
        Curabitur at consequat arcu. Aliquam placerat eros vitae lectus commodo egestas. Maecenas in
        augue quis lacus pretium placerat. Aenean ut aliquet velit. Curabitur lorem ipsum, suscipit
        ut facilisis porttitor, dictum eget felis. Fusce eu fermentum libero. Nam eros mi, viverra
        sagittis porta sit amet, lobortis at lectus. Cum sociis natoque penatibus et magnis dis
        parturient montes, nascetur ridiculus mus. Nulla ut accumsan urna. Sed auctor diam id
        facilisis dignissim. Morbi odio tellus, accumsan a scelerisque in, tristique in neque. Fusce
        ac sem vitae sem maximus dictum. Maecenas congue vestibulum vulputate. Aenean iaculis felis
        enim, non convallis velit ullamcorper ut. Maecenas ex metus, pulvinar sed convallis in,
        rutrum et mauris. Phasellus et purus libero. Donec porta commodo pellentesque. Suspendisse
        euismod volutpat faucibus. Suspendisse lacinia dui erat, imperdiet vehicula mi sagittis sit
        amet. Praesent laoreet pellentesque ex, eu imperdiet magna volutpat et. Nam sed tellus
        mauris. In ultrices nulla a lorem rhoncus, tincidunt convallis dolor venenatis. Donec enim
        mauris, sagittis ut lorem id, posuere aliquam lacus. Vivamus malesuada metus ipsum, non
        pretium urna elementum sed. Nunc tincidunt nec tortor ac semper. Nullam scelerisque magna
        sapien, a sollicitudin nisl tincidunt non. Aliquam efficitur nisl vitae placerat elementum.
        Maecenas volutpat, turpis ultrices venenatis iaculis, sem massa congue ipsum, a interdum
        dolor metus ac mi. Suspendisse massa lectus, accumsan eget nunc a, ornare laoreet ante.
        Vestibulum semper sem in dolor dignissim vulputate. In ac justo sem. Donec posuere lectus
        vel lorem consectetur congue. Morbi a interdum diam. Donec mollis lectus erat, id blandit
        magna scelerisque quis. Maecenas semper eu ipsum id ultrices. Nunc ultrices fermentum leo.
        Quisque at dictum diam. Ut suscipit bibendum est. Suspendisse maximus sem a ligula tempor
        feugiat. Nunc rutrum, leo a gravida condimentum, dolor neque egestas dui, tempor varius
        metus leo id turpis.
      </div>
    </div>
  )
}
export default {
  title: 'Other Tool',
  name: 'other-tool',
  icon: () => <div />,
  router: route('/', route('/:foo/:rand')),
  component: MyOtherTool
}
