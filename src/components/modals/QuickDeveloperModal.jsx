import { useState } from "react";
import { FaBuilding, FaGlobe, FaCity, FaSave } from "react-icons/fa";
import { FiX } from "react-icons/fi";
import { saveDeveloper } from "../../js/firebase";
import { toast } from "react-toastify";
import { useGameData } from "../../contexts/GameDataContext";

const QuickDeveloperModal = ({ isOpen, onClose, onCreated, initialName = "" }) => {
  const { refreshDevelopersData } = useGameData();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialName,
    logo: "",
    website: "",
    country: "",
    city: "",
    isStudio: false,
    parentCompanyId: "",
    studios: []
  });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Developer name is required");
      return;
    }

    setLoading(true);
    try {
      const newDevId = await saveDeveloper(formData, null);
      toast.success("Developer created successfully!");

      // Refresh context data
      await refreshDevelopersData();

      // Return the new developer info to the parent form
      if (onCreated) {
        onCreated({ id: newDevId, ...formData });
      }
      onClose();
    } catch (err) {
      console.error("Quick create failed:", err);
      toast.error("Failed to create developer");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-[#0a0a0c] border border-white/10 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <FaBuilding className="text-white text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-widest text-white">Quick Add Studio</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mt-1">Creating a new developer profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-white/5 rounded-2xl transition-colors text-white/20 hover:text-white"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-white/30 ml-1 mb-2 block">Studio Name</label>
              <div className="relative group">
                <FaBuilding className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" />
                <input
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 focus:outline-none focus:border-white/30 transition-all font-bold"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Naughty Dog"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-white/30 ml-1 mb-2 block">Country</label>
                <div className="relative group">
                  <FaGlobe className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" />
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 focus:outline-none focus:border-white/30 transition-all font-bold"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="USA"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-white/30 ml-1 mb-2 block">City (Optional)</label>
                <div className="relative group">
                  <FaCity className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" />
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 focus:outline-none focus:border-white/30 transition-all font-bold"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Santa Monica"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-widest text-white/30 ml-1 mb-2 block">Website</label>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-white/30 transition-all font-mono text-sm"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://www.naughtydog.com"
              />
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-widest text-white/30 ml-1 mb-2 block">Logo URL (Optional)</label>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-white/30 transition-all font-mono text-sm"
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                placeholder="https://link-to-logo.png"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-primary py-5 rounded-2xl text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <div className="size-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <FaSave />
                  <span>Create Developer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickDeveloperModal;
