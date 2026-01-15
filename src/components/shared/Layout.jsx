import Header from './Header';
import Drawer from "./Drawer";
import Footer from './Footer';
import { useState } from 'react';
import { ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useGameUI } from '../../contexts/GameUIContext';
import { useGameData } from '../../contexts/GameDataContext';
import LoginForm from '../modals/LoginForm';
import AddGameForm from '../modals/AddGameForm';
import EditGameForm from '../modals/EditGameForm';

const Layout = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const {
    isLogged,
    userData,
    edit,
    isModalOpen,
    handleCloseModal,
    gameToEdit
  } = useGameUI();
  const { games } = useGameData();

  return (
    <div className="min-h-screen flex flex-col">
      <Header onDrawerOpen={() => setDrawerOpen(true)} />
      <Drawer open={drawerOpen} setOpen={setDrawerOpen} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />

      {isModalOpen && (
        isLogged && userData?.isAdmin ? (
          edit ? (
            <EditGameForm
              game={gameToEdit}
              games={games}
              onSuccess={handleCloseModal}
            />
          ) : (
            <AddGameForm
              games={games}
              onClose={handleCloseModal}
              onSuccess={handleCloseModal}
            />
          )
        ) : (
          <LoginForm
            onSuccess={handleCloseModal}
            onClose={handleCloseModal}
          />
        )
      )}

      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={true}
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover={false}
        theme="dark"
        transition={Slide}
      />
    </div>
  );
};

export default Layout;