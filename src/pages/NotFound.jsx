import { useNavigate } from "react-router-dom";
import Layout from "../components/shared/Layout";
import { motion } from "framer-motion";
import { FaArrowLeft, FaGamepad } from "react-icons/fa";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center p-6 overflow-hidden relative">
        <div className="max-w-2xl w-full text-center space-y-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="relative inline-block">
              <h1 className="text-[120px] md:text-[180px] font-black leading-none tracking-tighter italic opacity-20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none bg-gradient-to-b from-white to-transparent bg-clip-text text-transparent">
                404
              </h1>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-black text-white italic tracking-tight">
                Page not found
              </h2>
              <p className="text-white/40 font-medium text-lg md:text-xl max-w-md mx-auto leading-relaxed">
                The page you're looking for has been moved or simply doesn't exist.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gradient-primary px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 group"
            >
              <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
              Respawn
            </button>
            <button
              onClick={() => navigate("/companies")}
              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all group"
            >
              <FaGamepad className="text-white/40 group-hover:text-white transition-colors" />
              Browse Companies
            </button>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
