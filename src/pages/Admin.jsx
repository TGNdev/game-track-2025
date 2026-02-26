import { useAuth } from "../contexts/AuthContext";
import Layout from "../components/shared/Layout";
import { Navigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaTrophy, FaTools, FaChevronRight } from "react-icons/fa";

const Admin = () => {
  const { userData, loading: authLoading } = useAuth();

  if (authLoading) return (
    <Layout>
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    </Layout>
  );

  if (!userData?.isAdmin) return <Navigate to="/" />;

  const adminTools = [
    {
      title: "The Game Awards",
      description: "Manage award categories, nominees and winners history through the years.",
      icon: <FaTrophy className="text-amber-400 text-3xl" />,
      link: "/admin/tga",
      color: "from-amber-500/20 to-yellow-500/20",
      borderColor: "border-amber-500/30",
      accentColor: "text-amber-400"
    }
  ];

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-6 py-10 md:py-20 min-h-[80vh]">
        <header className="mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-6 mb-4"
          >
            <div className="p-4 bg-gradient-primary rounded-[2rem] shadow-2xl">
              <FaTools className="text-white text-3xl" />
            </div>
            <div>
              <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent tracking-tighter">
                Admin Deck
              </h1>
              <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-xs md:text-sm mt-1">
                System Control & Management
              </p>
            </div>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {adminTools.map((tool, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Link to={tool.link} className="block h-full">
                <motion.div
                  whileHover={{ scale: 1.02, translateY: -5 }}
                  whileTap={{ scale: 0.98 }}
                  className={`bg-white/[0.03] border ${tool.borderColor} rounded-[2.5rem] p-10 backdrop-blur-xl hover:bg-white/[0.08] transition-all group h-full flex flex-col relative overflow-hidden shadow-2xl`}
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    {tool.icon}
                  </div>

                  <div className={`size-20 rounded-3xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-inner border border-white/10`}>
                    {tool.icon}
                  </div>

                  <h2 className="text-3xl font-black mb-4 text-white group-hover:text-primary-light transition-colors">
                    {tool.title}
                  </h2>

                  <p className="text-white/50 font-medium leading-relaxed mb-10 flex-grow text-lg">
                    {tool.description}
                  </p>

                  <div className={`flex items-center gap-3 font-black uppercase tracking-widest text-sm ${tool.accentColor} group-hover:gap-5 transition-all`}>
                    Open Tool <FaChevronRight />
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 border border-white/10 border-dashed rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center opacity-40 group relative"
          >
            <div className="size-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FaTools className="text-white/20 text-3xl" />
            </div>
            <h2 className="text-2xl font-black mb-3">More Modules</h2>
            <p className="text-white/40 font-medium max-w-[200px]">New administrative tools will appear here as the platform evolves.</p>

            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default Admin;
