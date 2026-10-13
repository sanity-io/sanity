import {customBox} from './fieldComponentsTest.css'

export default {
  name: 'fieldComponentsTest',
  type: 'document',
  title: 'Fields with React components',
  preview: {
    select: {
      title: 'title',
      media: 'image',
    },
    prepare({media, title}: any) {
      return {
        media,
        subtitle: 'example subtitle',
        title: title,
      }
    },
  },
  fields: [
    {
      name: 'title',
      title: <em style={{textDecoration: 'underline'}}>Title</em>,
      description: <span style={{textDecoration: 'line-through'}}>Title description</span>,
      type: 'string',
    },
    {
      name: 'image',
      title: <span>Image 🖼️</span>,
      description: (
        <div>
          <div>Image description 📷</div>
          <div style={{display: 'inline-block', padding: '2em'}}>
            <a href="https://www.sanity.io" rel="noopener noreferrer" target="_blank">
              <div className={customBox} />
            </a>
          </div>
        </div>
      ),
      type: 'image',
    },
    {
      name: 'subtitle',
      title: (
        <div>
          <h1 style={{fontWeight: 'bold'}}>Subtitle (h1)</h1>
          <h2>Subtitle (h2)</h2>
          <h3>Subtitle (h3)</h3>
        </div>
      ),
      description: (
        <span>
          Subtitle description <span style={{color: 'red'}}>x ← x - (JᵀJ + λIₙ༝ₙ)⁻¹ Jᵀr</span>
          <script>window.alert('👻')</script>
        </span>
      ),
      type: 'string',
    },
  ],
}
