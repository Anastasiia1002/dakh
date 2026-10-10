import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AboutPage } from './pages/AboutPage'
import { BookingPage } from './pages/BookingPage'
import { ConfirmationPage } from './pages/ConfirmationPage'
import { ContactPage } from './pages/ContactPage'
import { HomePage } from './pages/HomePage'
import { HotelPage } from './pages/HotelPage'
import { MenuPage } from './pages/MenuPage'
import { RoomPage } from './pages/RoomPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/gotel" element={<HotelPage />} />
        <Route path="/gotel/:slug" element={<RoomPage />} />
        <Route path="/restoran" element={<Navigate to="/menu" replace />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/pro-nas" element={<AboutPage />} />
        <Route path="/bronuvannya/pidtverdzhennya/:token" element={<ConfirmationPage />} />
        <Route path="/bronuvannya/pidtverdzhennya" element={<ConfirmationPage />} />
        <Route path="/bronuvannya" element={<BookingPage />} />
        <Route path="/kontakty" element={<ContactPage />} />
        <Route path="/prozhivannya" element={<Navigate to="/gotel" replace />} />
        <Route path="/prozhivannya/:slug" element={<Navigate to="/gotel" replace />} />
        <Route path="/spa" element={<Navigate to="/menu" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
