import { createBrowserRouter } from 'react-router';
import Anasayfa from '../Pages/Anasayfa/Anasayfa';
import App from '../Components/App';
import RequireAuth from '../Components/RequireAuth';
import LoginPage from '../Pages/Login/Login';
import SatisRaporuMaliyetliPage from '../Pages/SatisRaporu/SatisRaporu';
import DakikaMaliyetPage from '../Pages/DakikaMaliyet/DakikaMaliyetPage';
import SatisRaporuMaliyetliPlasmot from '../Pages/SatisRaporuPlasmot/SatisRaporuPlasmot';
import CiroRaporuPage from '../Pages/CiroRaporu/CiroRaporuPage';
import ShelfPage from '../Pages/Sevkiyat/ShelfPage';
import SevkiyatRapor from '../Pages/Sevkiyat/SevkiyatRapor';
import IskartaRaporuPage from '../Pages/SatisRaporuPlasmot/IskartaRaporuPage';
import SatisRaporuMaliyetliTestPage from '../Pages/SatisRaporuTest/SatisRaporuTest';
import AktifKullanicilarPage from '../Pages/QAD/AktifKullanicilar';

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/shelf",
    element: <ShelfPage />, // Sidebar ve Header olmayacak
  },
  {
    path: "/sevkiyat-raporu",
    element: <RequireAuth />,
    children: [
      {
        element: <App />,
        children: [
          { index: true, element: <SevkiyatRapor /> },
        ],
      },
    ],
  },
  {
    path: "/",
    element: <RequireAuth />,
    children: [
      {
        element: <App />, // ✅ Sidebar + Header bu layout'ta
        children: [
          { index: true, element: <Anasayfa /> },
          { path: "anasayfa", element: <Anasayfa /> },
          { path: "aktif-kullanicilar", element: <AktifKullanicilarPage /> },
          { path: "ciro-raporu", element: <CiroRaporuPage /> },
          { path: "dakika-maliyet", element: <DakikaMaliyetPage /> },
          { path: "satis-raporu-maliyetli", element: <SatisRaporuMaliyetliPage /> },
          { path: "satis-raporu-ermetal-test", element: <SatisRaporuMaliyetliTestPage /> },
          { path: "satis-raporu-maliyetli-plasmot", element: <SatisRaporuMaliyetliPlasmot /> },
          { path: "iskarta-raporu-plasmot", element: <IskartaRaporuPage /> },
        ],
      },
    ],
  },
]);

