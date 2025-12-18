import Header from './Header';
import Drawer from "./Drawer";
import Footer from './Footer';
import { useState } from 'react';

const Layout = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="max-w-full">
      <Header onDrawerOpen={() => setDrawerOpen(true)} />
      <Drawer open={drawerOpen} setOpen={setDrawerOpen} />
      {children}
      <Footer />
      <div id="image-portal-root" className="fixed top-0 left-0 w-screen h-screen z-[9999] pointer-events-none"></div>
    </div>
  );
};

export default Layout;