import './styles/App.css'
import AdminPage from './pages/AdminPage.jsx'
import HomePage from './pages/HomePage.jsx'

function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'

  if (path === '/admin') {
    return <AdminPage />
  }

  return (
    <HomePage />
  )
}

export default App
