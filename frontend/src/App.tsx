import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { catalogRedirect } from './lib/catalog/routes'
import { AboutPage } from './pages/AboutPage'
import { BookingPage } from './pages/BookingPage'
import { ConfirmationPage } from './pages/ConfirmationPage'
import { ContactPage } from './pages/ContactPage'
import { HomePage } from './pages/HomePage'
import { HotelPage } from './pages/HotelPage'
import { MenuPage } from './pages/MenuPage'
import { RoomPage } from './pages/RoomPage'

function LegacyRedirect() {
  const location = useLocation()
  return <Navigate to={catalogRedirect(location.pathname) ?? '/rooms'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/rooms" element={<HotelPage category="rooms" />} />
        <Route path="/rooms/:slug" element={<RoomPage category="rooms" />} />
        <Route path="/houses" element={<HotelPage category="houses" />} />
        <Route path="/houses/:slug" element={<RoomPage category="houses" />} />
        <Route path="/hotel" element={<Navigate to="/rooms" replace />} />
        <Route path="/hotel/:slug" element={<LegacyRedirect />} />
        <Route path="/sunny-park" element={<Navigate to="/houses" replace />} />
        <Route path="/sunny-park/:slug" element={<LegacyRedirect />} />
        <Route path="/gotel" element={<Navigate to="/rooms" replace />} />
        <Route path="/gotel/:slug" element={<LegacyRedirect />} />
        <Route path="/restoran" element={<Navigate to="/menu" replace />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/pro-nas" element={<AboutPage />} />
        <Route path="/bronuvannya/pidtverdzhennya/:token" element={<ConfirmationPage />} />
        <Route path="/bronuvannya/pidtverdzhennya" element={<ConfirmationPage />} />
        <Route path="/bronuvannya" element={<BookingPage />} />
        <Route path="/kontakty" element={<ContactPage />} />
        <Route path="/prozhivannya" element={<Navigate to="/rooms" replace />} />
        <Route path="/prozhivannya/:slug" element={<Navigate to="/rooms" replace />} />
        <Route path="/spa" element={<Navigate to="/menu" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
