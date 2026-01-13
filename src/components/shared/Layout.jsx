import Header from './Header';
import Drawer from "./Drawer";
import Footer from './Footer';
import { useState } from 'react';

const Layout = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header onDrawerOpen={() => setDrawerOpen(true)} />
      <Drawer open={drawerOpen} setOpen={setDrawerOpen} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;