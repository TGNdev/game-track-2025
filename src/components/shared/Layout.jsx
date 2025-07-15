import BackToTopButton from './BackTopButton';
import Header from './Header';

const Layout = ({ children }) => {
  return (
    <div className="px-6 pb-6 max-w-full">
      <Header />
      {children}
      <BackToTopButton />
      <div id="image-portal-root" className="fixed top-0 left-0 w-screen h-screen z-[9999] pointer-events-none"></div>
    </div>
  );
};

export default Layout;