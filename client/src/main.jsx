import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
// Fonts: substitutions approved in the UI kit (see styles/tokens.css)
import '@fontsource/caveat/400.css';
import '@fontsource/patrick-hand/400.css';
import '@fontsource/nunito-sans/400.css';
import '@fontsource/nunito-sans/700.css';
import '@fontsource/nunito-sans/800.css';
import '@fontsource/nunito-sans/900.css';
import '@fontsource/josefin-sans/400.css';
import '@fontsource/josefin-sans/700.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/site.css';
import PublicLayout from './components/PublicLayout.jsx';
import { Loader } from './components/ui.jsx';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import Legal from './pages/Legal.jsx';
import NotFound from './pages/NotFound.jsx';

// The CMS is loaded separately: site visitors don't download its code
const CmsApp = lazy(() => import('./CmsApp.jsx'));

// Page addresses: the same as "path" in server/src/data/pages.js (SEO, sitemap)
const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/about', element: <About /> },
      { path: '/contact', element: <Contact /> },
      { path: '/legal-notice', element: <Legal /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    path: '/cms/*',
    element: (
      <Suspense fallback={<div className="page-state"><Loader /></div>}>
        <CmsApp />
      </Suspense>
    ),
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
