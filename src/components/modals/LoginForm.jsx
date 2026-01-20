import { useState } from "react";
import { signIn, register } from "../../js/firebase";
import { toast } from "react-toastify";
import Modal from "./Modal";

const LoginForm = ({ onSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (isRegistering) {
        if (!username) {
          setError("Username is required.");
          return;
        }
        await register(email, password, username);
        toast.success("Welcome to GameTrack !");
      } else {
        await signIn(email, password);
        toast.success(`Welcome back !`);
      }
      onSuccess();
    } catch (error) {
      if (error.message === "Username already taken") {
        setError("This username is already taken.");
      } else {
        setError("Invalid credentials or email already in use.");
      }
    }
  };

  return (
    <Modal title={isRegistering ? "Register" : "Login"}>
      <form onSubmit={handleAuth} className="flex flex-col gap-6 mt-2">
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all"
              required
            />
          </div>

          {isRegistering && (
            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="How should we call you ?"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all"
                required
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all"
              required
            />
          </div>
        </div>

        {error && (
          <div className="text-sm bg-red-500/10 border border-red-500/20 text-red-500 py-3 px-4 rounded-xl font-bold flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4 mt-2">
          <button
            type="submit"
            className="w-full bg-gradient-primary py-4 rounded-xl text-white font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {isRegistering ? "Create Account" : "Let's Go !"}
          </button>

          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm text-white/40 hover:text-white transition-colors font-bold"
          >
            {isRegistering
              ? "Already have an account? Log In"
              : "Don't have an account? Sign Up"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default LoginForm;
