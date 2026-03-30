
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./lib/i18n"; // initialise i18next before first render
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(<App />);
  