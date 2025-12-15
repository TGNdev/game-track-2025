import { FiX } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useGame } from "../../contexts/GameContext";

const Drawer = ({ open, setOpen }) => {
  const {
    logout,
    isLogged
  } = useGame();

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-64 sm:w-96 bg-background text-lg shadow-lg z-50 transform transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"
          }`}
        aria-label="Navigation drawer"
      >
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 p-2 rounded-full bg-gradient-primary transition hover:scale-110 z-10"
          onClick={() => setOpen(false)}
          aria-label="Close navigation drawer"
        >
          <FiX size={24} />
        </button>
        {/* Navigation Content */}
        <nav className="mt-16 flex flex-col gap-4 px-6">
          <Link to="/" className="text-primary hover:text-white hover:scale-105 duration-150 transition">Home</Link>
          <Link to="/leaks-rumours" className="text-primary hover:text-white hover:scale-105 duration-150 transition">Leaks & Rumours</Link>
          {/* <Link to="/hall-of-fame" className="text-primary hover:text-white hover:scale-105 duration-150 transition">Hall Of Fame</Link> */}
          <Link to="/game-awards-history" className="text-primary hover:text-white hover:scale-105 duration-150 transition">Game Awards History</Link>
          {/* <Link to="/release-calendar" className="text-primary hover:text-white hover:scale-105 duration-150 transition">Releases & Events Calendar</Link> */}
          <div className="border my-6"></div>
          <button
            className="text-left hover:scale-105 rounded-md text-white py-1.5 px-2 bg-gradient-primary w-fit transition"
            onClick={() => {
              setOpen(false);
              logout();
            }}
          >
            {isLogged ? (
              <div>Logout</div>
            ) : (
              <div>I am an admin</div>
            )}
          </button>
        </nav>
      </aside>
    </>
  );
};

export default Drawer;