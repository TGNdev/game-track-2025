import { useState, useEffect, useMemo, memo } from "react";
import Layout from "../../components/shared/Layout";
import { FaDev, FaPlus, FaTrash, FaSave, FaBuilding, FaGlobe, FaCity, FaEdit, FaCheckCircle } from "react-icons/fa";
import { FiX, FiSearch } from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";
import { useGameData } from "../../contexts/GameDataContext";
import { Navigate } from "react-router-dom";
import { saveDeveloper, deleteDeveloperFromFirestore } from "../../js/firebase";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

export const adminConfig = {
  title: "Developers (Legacy)",
  description: "DEPRECATED: Use the new Company Administrator instead. Manage developers and publishers.",
  icon: FaDev,
  color: "from-amber-500/10 to-yellow-500/10",
  borderColor: "border-amber-500/20",
  accentColor: "text-amber-400/50",
  active: false
};

const AdminDevelopers = () => {
  const { userData, loading: authLoading } = useAuth();
  const { developers, loadingDevelopers: loading, ensureDevelopersLoaded: fetchDevelopers, refreshDevelopersData } = useGameData();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [editingDev, setEditingDev] = useState(null);
  const [selectedLetter, setSelectedLetter] = useState("A");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    logo: "",
    website: "",
    country: "",
    city: "",
    isStudio: false,
    parentCompanyId: "",
    studios: []
  });
  const [newStudio, setNewStudio] = useState("");
  const [parentSearch, setParentSearch] = useState("");
  const [showParentSuggestions, setShowParentSuggestions] = useState(false);

  useEffect(() => {
    fetchDevelopers();
  }, [fetchDevelopers]);

  // Set initial available letter
  useEffect(() => {
    if (developers.length > 0 && !searchQuery) {
      const availableLetters = [...new Set(
        developers
          .filter(d => d.name && d.name.length > 0)
          .map(d => {
            const firstChar = d.name[0].toUpperCase();
            return /\d/.test(firstChar) ? "#" : firstChar;
          })
      )].sort();
      if (availableLetters.length > 0 && !availableLetters.includes(selectedLetter)) {
        const priorityLetter = availableLetters.includes("A") ? "A" : availableLetters[0];
        setSelectedLetter(priorityLetter);
      }
    }
  }, [developers, searchQuery, selectedLetter]);

  const handleCreateNew = () => {
    setEditingDev({ id: "new" });
    setFormData({
      name: "",
      logo: "",
      website: "",
      country: "",
      city: "",
      isStudio: false,
      parentCompanyId: "",
      studios: []
    });
    setParentSearch("");
    setNewStudio("");
  };

  const handleEdit = (dev) => {
    setEditingDev(dev);
    setFormData({
      name: dev.name || "",
      logo: dev.logo || "",
      website: dev.website || "",
      country: dev.country || "",
      city: dev.city || "",
      isStudio: dev.isStudio || false,
      parentCompanyId: dev.parentCompanyId || "",
      studios: dev.studios || []
    });
    setNewStudio("");

    if (dev.parentCompanyId) {
      const parent = developers.find(d => d.id === dev.parentCompanyId);
      setParentSearch(parent ? parent.name : "");
    } else {
      setParentSearch("");
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Developer name is required");
      return;
    }

    try {
      const docId = editingDev.id === "new" ? null : editingDev.id;
      await saveDeveloper(formData, docId);
      toast.success("Developer saved successfully!");
      setEditingDev(null);
      refreshDevelopersData();
    } catch (err) {
      toast.error("Failed to save developer");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this developer?")) return;
    try {
      await deleteDeveloperFromFirestore(id);
      toast.success("Developer deleted");
      refreshDevelopersData();
    } catch (err) {
      toast.error("Failed to delete developer");
    }
  };

  const parentSuggestions = useMemo(() => {
    return developers
      .filter(dev =>
        dev.id !== editingDev?.id &&
        dev.name.toLowerCase().includes(parentSearch.toLowerCase())
      );
  }, [developers, parentSearch, editingDev]);

  const filteredDevelopers = useMemo(() => {
    const query = debouncedSearch.toLowerCase();
    let list = developers;

    if (query) {
      list = list.filter(dev => dev.name.toLowerCase().includes(query));
    } else if (selectedLetter) {
      if (selectedLetter === "#") {
        list = list.filter(dev => /\d/.test(dev.name[0]));
      } else {
        list = list.filter(dev => dev.name[0].toUpperCase() === selectedLetter);
      }
    }

    return list
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(dev => ({
        ...dev,
        parentName: developers.find(d => d.id === dev.parentCompanyId)?.name || null,
        subsidiaryCount: developers.filter(d => d.parentCompanyId === dev.id).length
      }));
  }, [developers, debouncedSearch, selectedLetter]);

  const alphabet = useMemo(() => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const availableCategories = [...new Set(
      developers
        .filter(dev => dev.name && dev.name.length > 0)
        .map(dev => {
          const firstChar = dev.name[0].toUpperCase();
          return /\d/.test(firstChar) ? "#" : firstChar;
        })
    )];

    const alphaItems = letters.map(char => ({
      char,
      hasDevs: availableCategories.includes(char)
    }));

    return [
      { char: "#", hasDevs: availableCategories.includes("#") },
      ...alphaItems
    ];
  }, [developers]);

  const handleLetterClick = (letter) => {
    setSelectedLetter(letter);
    setSearchQuery("");
  };

  if (authLoading) return (
    <Layout>
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    </Layout>
  );

  if (!userData?.isAdmin) return <Navigate to="/" />;

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Developer Administrator
            </h1>
            <p className="text-white/40 font-bold uppercase tracking-widest text-sm mt-2">
              Manage developers and their internal studios
            </p>
          </div>

          {!editingDev ? (
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 bg-gradient-primary px-6 py-3 rounded-2xl font-bold shadow-xl hover:scale-105 transition-transform"
            >
              <FaPlus /> Add New Developer
            </button>
          ) : (
            <button
              onClick={() => setEditingDev(null)}
              className="flex items-center gap-2 bg-white/10 px-6 py-3 rounded-2xl font-bold hover:bg-white/20 transition-colors"
            >
              <FiX /> Cancel
            </button>
          )}
        </header>

        {editingDev ? (
          <div
            className="space-y-8"
          >
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md relative z-10">
              <h2 className="text-xl font-black mb-6 flex items-center gap-3">
                <FaBuilding className="text-white/20" />
                Main Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="md:col-span-2 lg:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-3">Developer Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-white/30 font-bold text-lg"
                    placeholder="e.g. Ubisoft"
                  />
                </div>
                <div className="md:col-span-1 lg:col-span-1">
                  <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-3">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-white/30 font-bold"
                    placeholder="e.g. Montreal"
                  />
                </div>
                <div className="md:col-span-1 lg:col-span-1">
                  <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-3">Country of Origin</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-white/30 font-bold"
                    placeholder="e.g. France"
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-3">Logo URL</label>
                  <input
                    type="text"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-white/30 font-bold"
                    placeholder="https://..."
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-3">Official Website</label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-white/30 font-bold"
                    placeholder="https://studio-name.com"
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-2 flex items-end">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isStudio: !formData.isStudio, parentCompanyId: !formData.isStudio ? formData.parentCompanyId : "" })}
                    className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase tracking-widest transition-all w-full border ${formData.isStudio ? "bg-gradient-primary text-white" : "bg-white/5 text-white/40"}`}
                  >
                    <FaCity />
                    {formData.isStudio ? "Internal Studio Active" : "Internal Studio ?"}
                  </button>
                </div>
              </div>
            </div>

            {/* Parent Company Selection */}
            {formData.isStudio && (
              <div className={`bg-white/5 border border-white/10 rounded-3xl p-8 transition-all ${showParentSuggestions ? "relative z-20" : "relative z-10"}`}>
                <h2 className="text-xl font-black mb-6 flex items-center gap-3">
                  <FaBuilding className="text-white/20" />
                  Parent Company
                </h2>
                <div className="relative">
                  <div className="relative group">
                    <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors font-bold" />
                    <input
                      type="text"
                      value={parentSearch}
                      onChange={(e) => {
                        setParentSearch(e.target.value);
                        setShowParentSuggestions(true);
                      }}
                      onFocus={() => setShowParentSuggestions(true)}
                      className="w-full bg-black/20 border border-white/10 rounded-2xl pl-14 pr-6 py-4 focus:outline-none focus:border-white/30 font-bold"
                      placeholder="Search for a parent company (e.g. Ubisoft, Sony, EA...)"
                    />
                  </div>

                  {showParentSuggestions && parentSearch && (
                    <div className="absolute top-14 left-0 right-0 mt-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                      {parentSuggestions.length > 0 ? (
                        <div className="max-h-60 overflow-y-auto">
                          {parentSuggestions.map(parent => (
                            <div
                              key={parent.id}
                              onClick={() => {
                                setFormData({ ...formData, parentCompanyId: parent.id });
                                setParentSearch(parent.name);
                                setShowParentSuggestions(false);
                              }}
                              className="w-full px-6 py-4 text-left hover:bg-white/10 hover:cursor-pointer flex items-center justify-between group transition-colors border-b border-white/5 last:border-0"
                            >
                              <div className="flex items-center gap-3">
                                <div className="size-8 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden">
                                  {parent.logo ? <img src={parent.logo} alt={parent.name} className="w-full h-full object-cover" /> : <FaBuilding className="text-white/20" />}
                                </div>
                                <span className="font-bold">{parent.name}</span>
                              </div>
                              <span className="text-[10px] font-black uppercase text-white/40">Select</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-white/20 italic">No parent companies found</div>
                      )}
                    </div>
                  )}

                  {formData.parentCompanyId && (
                    <div className="mt-4 flex items-center gap-4 bg-white/10 rounded-2xl p-4">
                      <div className="size-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                        <FaCheckCircle className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black uppercase text-white tracking-widest">Selected Parent</p>
                        <p className="font-black text-lg">
                          {developers.find(d => d.id === formData.parentCompanyId)?.name}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setFormData({ ...formData, parentCompanyId: "" });
                          setParentSearch("");
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg text-white hover:text-white transition-colors"
                      >
                        <FiX />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Studio Locations (Offices) */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md relative z-10">
              <h2 className="text-xl font-black mb-6 flex items-center gap-3">
                <FaCity className="text-white/20" />
                Office Locations
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={newStudio}
                    onChange={(e) => setNewStudio(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newStudio.trim()) {
                          setFormData({ ...formData, studios: [...formData.studios, newStudio.trim()] });
                          setNewStudio("");
                        }
                      }
                    }}
                    className="flex-1 bg-black/20 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-white/30 font-bold"
                    placeholder="e.g. Edinburgh, Scotland"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newStudio.trim()) {
                        setFormData({ ...formData, studios: [...formData.studios, newStudio.trim()] });
                        setNewStudio("");
                      }
                    }}
                    className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all"
                  >
                    Add
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {formData.studios.map((location, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3 group hover:border-white/20 transition-all"
                    >
                      <span className="font-bold text-sm truncate pr-2">{location}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updatedStudios = formData.studios.filter((_, i) => i !== index);
                          setFormData({ ...formData, studios: updatedStudios });
                        }}
                        className="text-white/20 hover:text-red-400 transition-colors"
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                  {formData.studios.length === 0 && (
                    <div className="col-span-full border border-dashed border-white/10 rounded-2xl p-6 text-center">
                      <p className="text-white/20 text-xs font-black uppercase tracking-widest italic">No specific office locations added yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setEditingDev(null)}
                className="px-10 py-4 rounded-2xl font-black text-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-3 bg-gradient-secondary px-10 py-4 rounded-2xl font-black text-lg shadow-2xl hover:scale-105 transition-transform"
              >
                <FaSave /> Save Developer
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative group">
              <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors text-xl" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search developers..."
                className="w-full bg-white/5 border border-white/10 rounded-[2rem] pl-16 pr-8 py-6 focus:outline-none focus:border-white/20 font-bold text-lg backdrop-blur-md"
              />
            </div>

            {/* Alphabet Navigation */}
            <div className="flex flex-wrap justify-center gap-1 md:gap-2 py-2">
              {alphabet.map(({ char, hasDevs }) => (
                <button
                  key={char}
                  onClick={() => hasDevs && handleLetterClick(char)}
                  disabled={!hasDevs}
                  className={`size-8 md:size-10 rounded-xl flex items-center justify-center font-black transition-all ${hasDevs
                    ? selectedLetter === char && !debouncedSearch.trim()
                      ? "bg-white/5 text-white shadow-lg scale-110"
                      : "bg-white/5 hover:bg-white/10 hover:text-white cursor-pointer"
                    : "opacity-10 cursor-not-allowed"
                    }`}
                >
                  {char}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDevelopers.map((dev) => (
                  <div id={`dev-${dev.id}`} key={dev.id}>
                    <DeveloperCard
                      dev={dev}
                      handleEdit={handleEdit}
                      handleDelete={handleDelete}
                    />
                  </div>
                ))}
              </div>
            )}

            {!loading && filteredDevelopers.length === 0 && (
              <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                <p className="text-white/40 text-xl font-bold italic">No developers found matching your search.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

const DeveloperCard = memo(({ dev, handleEdit, handleDelete }) => {
  return (
    <motion.div
      layoutId={dev.id}
      className="bg-white/5 border border-white/10 h-full rounded-3xl p-6 backdrop-blur-sm hover:border-white/20 transition-all group relative overflow-hidden flex flex-col gap-2"
    >
      <div className="flex justify-between items-start">
        <div className="size-20 flex items-center justify-center overflow-hidden bg-white/10 rounded-2xl">
          {dev.logo ? (
            <img src={dev.logo} alt={dev.name} className="w-full h-full object-contain p-2" />
          ) : (
            <FaBuilding className="text-white/20 text-2xl" />
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(dev)}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-white/40 hover:text-white"
          >
            <FaEdit size={16} />
          </button>
          <button
            onClick={() => handleDelete(dev.id)}
            className="p-3 bg-white/5 hover:bg-red-500/20 rounded-xl transition-colors text-white/40 hover:text-white"
          >
            <FaTrash size={16} />
          </button>
        </div>
      </div>

      <h3 className="text-2xl font-black">{dev.name}</h3>
      <div className="flex items-center gap-3 text-white/40 text-sm mb-6">
        <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full border border-white/5">
          <FaGlobe size={10} className="text-white/40" />
          <span className="font-bold flex items-center gap-1.5">
            {dev.country}
            {dev.city && <span className="text-white/70">• {dev.city}</span>}
          </span>
        </div>
      </div>

      {dev.studios && dev.studios.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-white/70">
              Locations ({dev.studios.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            {dev.studios.slice(0, 5).map((location, index) => (
              <span key={index} className="text-[10px] font-bold bg-white/10 border border-white/5 px-2 py-1 rounded-md text-white/70">
                {location}
              </span>
            ))}
            {dev.studios.length > 5 && (
              <span className="text-[10px] font-bold bg-white/5 border border-white/5 px-2 py-1 rounded-md text-white/20">
                +{dev.studios.length - 5} more
              </span>
            )}
          </div>
        </>
      )}

      {(dev.parentName || dev.subsidiaryCount > 0) && (
        <div className="mt-auto flex flex-col gap-2">
          {dev.parentName && (
            <div className="bg-black/20 rounded-2xl p-3 flex items-center justify-between border border-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                Parent Company
              </span>
              <span className="text-sm font-black text-white truncate ml-4">
                {dev.parentName}
              </span>
            </div>
          )}
          {dev.subsidiaryCount > 0 && (
            <div className="bg-black/20 rounded-2xl p-3 flex items-center justify-between border border-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                Subsidiaries
              </span>
              <span className="text-sm font-black text-white">
                {dev.subsidiaryCount}
              </span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
});

export default AdminDevelopers;