import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Polyfill Node globals for browser (needed by simple-peer dependencies)
import { Buffer } from 'buffer';
import process from 'process';

if (typeof (window as any).global === 'undefined') {
  (window as any).global = window;
}
if (typeof (window as any).process === 'undefined') {
  (window as any).process = process;
}
if (typeof (window as any).Buffer === 'undefined') {
  (window as any).Buffer = Buffer;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
