import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { BookingPage } from './pages/BookingPage'
import { ContactPage } from './pages/ContactPage'
import { HomePage } from './pages/HomePage'
import { RestaurantPage } from './pages/RestaurantPage'
import { SpaPage } from './pages/SpaPage'
import { StayDetailPage } from './pages/StayDetailPage'
import { StaysPage } from './pages/StaysPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/prozhivannya" element={<StaysPage />} />
        <Route path="/prozhivannya/:slug" element={<StayDetailPage />} />
        <Route path="/spa" element={<SpaPage />} />
        <Route path="/restoran" element={<RestaurantPage />} />
        <Route path="/bronuvannya" element={<BookingPage />} />
        <Route path="/kontakty" element={<ContactPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
