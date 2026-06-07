import { Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout'
import ParentLayout from './layouts/ParentLayout'
import Dashboard from './pages/admin/Dashboard'
import Students from './pages/admin/Students'
import Artworks from './pages/admin/Artworks'
import Upload from './pages/admin/Upload'
import Tags from './pages/admin/Tags'
import Messages from './pages/admin/Messages'
import PendingArtworks from './pages/admin/PendingArtworks'
import ParentLogin from './pages/parent/Login'
import ParentPortfolio from './pages/parent/Portfolio'
import ArtworkDetail from './pages/parent/ArtworkDetail'

function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="artworks" element={<Artworks />} />
          <Route path="upload" element={<Upload />} />
          <Route path="pending" element={<PendingArtworks />} />
          <Route path="tags" element={<Tags />} />
          <Route path="messages" element={<Messages />} />
        </Route>

        <Route path="/parent" element={<ParentLayout />}>
          <Route index element={<ParentLogin />} />
          <Route path="portfolio" element={<ParentPortfolio />} />
          <Route path="artwork/:id" element={<ArtworkDetail />} />
        </Route>

        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </div>
  )
}

export default App
