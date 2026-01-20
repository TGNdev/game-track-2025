import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

const splash = document.getElementById("splash-screen");
if (splash) {
    splash.style.opacity = "0";
    setTimeout(() => {
        if (splash.parentNode) {
            splash.remove();
        }
    }, 500);
}