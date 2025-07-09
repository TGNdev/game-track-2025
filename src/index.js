import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

const splash = document.getElementById("splash-screen");
if (splash) {
    splash.classList.add("opactity-0", "transition-opacity", "duration-500");
    setTimeout(() => {
        splash.remove();
    }, 500);
}