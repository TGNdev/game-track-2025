import { useState } from "react";
import { signIn } from "../../js/firebase";
import { toast } from "react-toastify";
import Modal from "./Modal";

const LoginForm = ({ onSuccess, onClose }) => {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      await signIn(email, password);
      toast.success("Admin is gaming !");
      onSuccess();
    } catch (error) {
      setError("You are NOT an admin.");
    }
  };

  return (
    <Modal title={"Login"}>
      <form onSubmit={handleLogin} className="flex flex-col gap-4 mt-6">
        <div className="w-full flex flex-row gap-3 justify-between">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter admin email"
            className="border px-3 py-2 rounded w-full"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            className="border px-3 py-2 rounded w-full"
          />
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="flex justify-between items-center">
          <button
            type="submit"
            className="bg-gradient-primary text-white py-1.5 px-3 rounded hover:scale-105 transition"
          >
            I am an admin
          </button>
          <button onClick={onClose} type="button" className="text-sm text-gray-500 hover:underline">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default LoginForm;
