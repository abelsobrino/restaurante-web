import './services/config.js';
import './services/db.js';
import './services/auth.js';
import './services/auth-email.js';
import './services/image-utils.js';
import './services/stock.js';
import './services/sesion.js';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
// db.js conserva referencia al objeto de configuración; se modifica antes de cualquier consulta.
const config = window.LAFONDA_CONFIG;
if (import.meta.env.VITE_SUPABASE_URL) config.supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
if (import.meta.env.VITE_SUPABASE_ANON_KEY) config.supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
createRoot(document.getElementById('root')).render(<BrowserRouter><App/></BrowserRouter>);
