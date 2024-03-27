import React from 'react'
import ReactDOM from 'react-dom/client'
import './globals.css'
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import Root from './routes/root';
import Token from './routes/token';
import TradingGroup from './components/trading-group';
import { Toaster } from './components/ui/toaster';
import Settings from './routes/settings';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      {
        path: '/',
        element: <TradingGroup />,
      },
      {
          path: "token/:address",
          element: <Token />,
      },
      {
          path: "settings",
          element: <Settings />,
      }

    ]
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router}/>
    <Toaster />
  </React.StrictMode>,
)
