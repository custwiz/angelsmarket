// import { createRoot } from 'react-dom/client'
// import App from './App.tsx'
// import './index.css'

// createRoot(document.getElementById("root")!).render(<App />);



import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import axios from "axios";
// axios.defaults.baseURL = "http://localhost:4000";
axios.defaults.baseURL = "https://shop.angelsonearthhub.com";
createRoot(document.getElementById("root")!).render(<App />);