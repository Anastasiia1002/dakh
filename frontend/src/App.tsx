import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { Layout } from './components/Layout'
import { legacyGotelTarget } from './lib/catalog/routes'
import { AboutPage } from './pages/AboutPage'
import { BookingPage } from './pages/BookingPage'
import { ConfirmationPage } from './pages/ConfirmationPage'
import { ContactPage } from './pages/ContactPage'
import { HomePage } from './pages/HomePage'
import { HotelPage } from './pages/HotelPage'
import { MenuPage } from './pages/MenuPage'
import { RoomPage } from './pages/RoomPage'

function LegacyGotelRedirect() {
  const { slug = '' } = useParams()
  return <Navigate to={legacyGotelTarget(decodeURIComponent(slug))} replace />
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/hotel" element={<HotelPage hotel="dakh" />} />
        <Route path="/hotel/:slug" element={<RoomPage hotel="dakh" />} />
        <Route path="/sunny-park" element={<HotelPage hotel="sunny-park" />} />
        <Route path="/sunny-park/:slug" element={<RoomPage hotel="sunny-park" />} />
        <Route path="/gotel" element={<Navigate to="/hotel" replace />} />
        <Route path="/gotel/:slug" element={<LegacyGotelRedirect />} />
        <Route path="/restoran" element={<Navigate to="/menu" replace />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/pro-nas" element={<AboutPage />} />
        <Route path="/bronuvannya/pidtverdzhennya/:token" element={<ConfirmationPage />} />
        <Route path="/bronuvannya/pidtverdzhennya" element={<ConfirmationPage />} />
        <Route path="/bronuvannya" element={<BookingPage />} />
        <Route path="/kontakty" element={<ContactPage />} />
        <Route path="/prozhivannya" element={<Navigate to="/hotel" replace />} />
        <Route path="/prozhivannya/:slug" element={<Navigate to="/hotel" replace />} />
        <Route path="/spa" element={<Navigate to="/menu" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
