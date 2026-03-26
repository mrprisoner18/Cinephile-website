import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    // Serve the pure HTML app directly so hardware back button
    // works correctly in WebView / PWA without iframe complications
    window.location.replace("/app.html");
  }, []);
  return null;
};

export default Index;
