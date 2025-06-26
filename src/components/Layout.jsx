import BackToTopButton from './BackTopButton';
import Header from './Header';

const Layout = ({ children }) => {
  return (
    <div className="px-6 pb-6 max-w-full">
      <Header />
      {children}
      <BackToTopButton />
    </div>
  );
};

export default Layout;