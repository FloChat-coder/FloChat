import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { marked } from 'marked'

const docs = [
  { id: 'home', title: 'Documentation Home', file: null },
  { id: 'getting-started', title: 'Getting Started', file: 'getting-started.md' },
  { id: 'customization-guide', title: 'Customization Guide', file: 'customization-guide.md' },
  { id: 'routing-and-pages', title: 'Routing & Pages', file: 'routing-and-pages.md' },
  { id: 'layout-system', title: 'Layout System', file: 'layout-system.md' },
  { id: 'data-management', title: 'Data Management', file: 'data-management.md' },
  { id: 'components-guide', title: 'Components Guide', file: 'components-guide.md' },
  { id: 'loading-and-performance', title: 'Loading & Performance', file: 'loading-and-performance.md' },
  { id: 'styling-guide', title: 'Styling Guide', file: 'styling-guide.md' },
  { id: 'deployment', title: 'Deployment', file: 'deployment.md' },
  { id: 'troubleshooting', title: 'Troubleshooting', file: 'troubleshooting.md' }
]

function Sidebar() {
  const location = useLocation()
  const currentPath = location.pathname.slice(1) || 'home'

  return (
    <div className="sidebar">
      <h2>GlobalBank Docs</h2>
      <ul>
        {docs.map(doc => (
          <li key={doc.id}>
            <Link
              to={doc.id === 'home' ? '/' : `/${doc.id}`}
              className={currentPath === doc.id ? 'active' : ''}
            >
              {doc.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function HomePage() {
  const quickStart = [
    { title: 'Getting Started', desc: 'Installation, setup, and first steps', id: 'getting-started' },
    { title: 'Customization Guide', desc: 'Logo, favicon, and theme customization', id: 'customization-guide' },
    { title: 'Data Management', desc: 'Working with JSON data files', id: 'data-management' },
    { title: 'Deployment', desc: 'Building and deploying your template', id: 'deployment' }
  ]

  return (
    <div>
      <h1>GlobalBank Documentation</h1>
      <p>
        Welcome to the comprehensive documentation for the GlobalBank React template.
        This documentation covers all aspects of customizing and working with the banking template.
      </p>

      <h2>Quick Start</h2>
      <div className="home-grid">
        {quickStart.map(item => (
          <Link key={item.id} to={`/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="home-card">
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <h2>All Documentation</h2>
      <div className="home-grid">
        {docs.slice(1).map(doc => (
          <Link key={doc.id} to={`/${doc.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="home-card">
              <h3>{doc.title}</h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function DocPage({ docId }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const doc = docs.find(d => d.id === docId)
    if (!doc || !doc.file) {
      setContent('')
      setLoading(false)
      return
    }

    fetch(`/${doc.file}`)
      .then(response => response.text())
      .then(markdown => {
        setContent(marked(markdown))
        setLoading(false)
      })
      .catch(error => {
        console.error('Error loading documentation:', error)
        setContent('<p>Error loading documentation.</p>')
        setLoading(false)
      })
  }, [docId])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div dangerouslySetInnerHTML={{ __html: content }} />
  )
}

function App() {
  return (
    <BrowserRouter>
      <div className="container">
        <Sidebar />
        <div className="content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            {docs.slice(1).map(doc => (
              <Route
                key={doc.id}
                path={`/${doc.id}`}
                element={<DocPage docId={doc.id} />}
              />
            ))}
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App