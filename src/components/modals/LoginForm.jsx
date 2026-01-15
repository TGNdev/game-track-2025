import { useState } from "react";
import { signIn, register } from "../../js/firebase";
import { toast } from "react-toastify";
import Modal from "./Modal";

const LoginForm = ({ onSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (isRegistering) {
        await register(email, password);
        toast.success("Welcome to GameTrack !");
      } else {
        const { user } = await signIn(email, password);
        toast.success(`Welcome back ${user.displayName || email.split("@")[0]} !`);
      }
      onSuccess();
    } catch (error) {
      setError("Invalid credentials.");
    }
  };

  return (
    <Modal title={isRegistering ? "Register" : "Login"}>
      <form onSubmit={handleAuth} className="flex flex-col gap-4 mt-6">
        <div className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="border px-3 py-2 rounded w-full bg-background"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="border px-3 py-2 rounded w-full bg-background"
            required
          />
        </div>
        {error && <div className="text-sm bg-gradient-error py-1 px-2 rounded">{error}</div>}
        <div className="flex flex-col gap-3">
          <button
            type="submit"
            className="bg-gradient-primary py-2 px-4 rounded font-medium"
          >
            {isRegistering ? "Sign Up" : "Log In"}
          </button>
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm text-gray-400 hover:text-white transition-colors"
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
