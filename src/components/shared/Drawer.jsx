import { FiX, FiHome, FiUser, FiLogOut } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useGameUI } from "../../contexts/GameUIContext";
import { FaTrophy, FaCalendar } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";

const Drawer = ({ open, setOpen }) => {
  const {
    logout,
    isLogged,
    setIsModalOpen,
    openButtonRef,
  } = useGameUI();
  const { userData } = useAuth();

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={`fixed top-0 right-0 h-full w-80 bg-background z-[51] transform transition-transform duration-300 ease-in-out shadow-2xl border-l border-white/5 ${open ? "translate-x-0" : "translate-x-full"
          }`}
        aria-label="Navigation drawer"
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-6 border-b border-white/10">
            <h2 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {isLogged ? "Hey, " + userData?.username + " !" : "Menu"}
            </h2>
            <button
              onClick={() => setOpen(false)}
              className="p-2 bg-gradient-primary rounded-full"
              aria-label="Close navigation drawer"
            >
              <FiX className="size-6" />
            </button>
          </div>

          <nav className="flex-1 p-2 space-y-2">
            <Link
              to="/"
              className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              onClick={() => setOpen(false)}
            >
              <div className="p-2 rounded-lg bg-gradient-primary transition-colors">
                <FiHome className="size-5" />
              </div>
              <span className="font-semibold">Home</span>
            </Link>

            <Link
              to="/game-awards-history"
              className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              onClick={() => setOpen(false)}
            >
              <div className="p-2 rounded-lg bg-gradient-primary transition-colors">
                <FaTrophy className="size-5" />
              </div>
              <span className="font-semibold">Game Awards History</span>
            </Link>

            <Link
              to="/release-calendar"
              className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              onClick={() => setOpen(false)}
            >
              <div className="p-2 rounded-lg bg-gradient-primary transition-colors">
                <FaCalendar className="size-5" />
              </div>
              <span className="font-semibold">Releases & Events Calendar</span>
            </Link>

            {isLogged && (
              <Link
                to={`/profiles/${userData?.username}`}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                onClick={() => setOpen(false)}
              >
                <div className="p-2 rounded-lg bg-gradient-primary transition-colors">
                  <FiUser className="size-5" />
                </div>
                <span className="font-semibold">My Profile</span>
              </Link>
            )}
          </nav>

          <div className="p-6 border-t border-white/10">
            <button
              ref={openButtonRef}
              className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-gradient-primary font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                if (isLogged) {
                  logout();
                } else {
                  setIsModalOpen(true);
                }
                setOpen(false);
              }}
            >
              {isLogged ? (
                <>
                  <FiLogOut className="size-5" />
                  <span>Logout</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Drawer;