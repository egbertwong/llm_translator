import { createRoot } from "react-dom/client";
import { TranslatorView } from "./views/TranslatorView";
import "./styles.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found.");
}

createRoot(rootElement).render(<TranslatorView />);
