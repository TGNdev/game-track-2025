import { useState, useEffect, useMemo, memo } from "react";
import Layout from "../../components/shared/Layout";
import { FaGlobe, FaPlus, FaTrash, FaSave, FaBuilding, FaCity, FaEdit, FaCheckCircle, FaUserTie, FaDev, FaLink } from "react-icons/fa";
import { FiX, FiSearch } from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";
import { useGameData } from "../../contexts/GameDataContext";
import { Navigate } from "react-router-dom";
import { saveEditor, deleteEditorFromFirestore } from "../../js/firebase";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

export const adminConfig = {
  title: "Editor Administrator",
  description: "Manage editors and publishers.",
  icon: FaUserTie,
  color: "from-purple-500/20 to-pink-500/20",
  borderColor: "border-purple-500/30",
  accentColor: "text-purple-400"
};

const AdminEditors = () => {
  const { userData, loading: authLoading } = useAuth();
  const { editors, loadingEditors: loading, ensureEditorsLoaded: fetchEditors, refreshEditorsData, developers, ensureDevelopersLoaded: fetchDevelopers } = useGameData();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [editingEd, setEditingEd] = useState(null);
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
    isStudio: false, // Keeping fields for consistency with developers
    parentCompanyId: "",
    linkedDeveloperId: "",
    studios: []
  });
  const [newStudio, setNewStudio] = useState("");
  const [parentSearch, setParentSearch] = useState("");
  const [devSearch, setDevSearch] = useState("");
  const [showParentSuggestions, setShowParentSuggestions] = useState(false);
  const [showDevSuggestions, setShowDevSuggestions] = useState(false);

  useEffect(() => {
    fetchEditors();
    fetchDevelopers();
  }, [fetchEditors, fetchDevelopers]);

  // Set initial available letter
  useEffect(() => {
    if (editors.length > 0 && !searchQuery) {
      const availableLetters = [...new Set(
        editors
          .filter(e => e.name && e.name.length > 0)
          .map(e => {
            const firstChar = e.name[0].toUpperCase();
            return /\d/.test(firstChar) ? "#" : firstChar;
          })
      )].sort();
      if (availableLetters.length > 0 && !availableLetters.includes(selectedLetter)) {
        const priorityLetter = availableLetters.includes("A") ? "A" : availableLetters[0];
        setSelectedLetter(priorityLetter);
      }
    }
  }, [editors, searchQuery, selectedLetter]);

  const handleCreateNew = () => {
    setEditingEd({ id: "new" });
    setFormData({
      name: "",
      logo: "",
      website: "",
      country: "",
      city: "",
      isStudio: false,
      parentCompanyId: "",
      linkedDeveloperId: "",
      studios: []
    });
    setParentSearch("");
    setDevSearch("");
    setNewStudio("");
  };

  const handleEdit = (ed) => {
    // Use raw data from the editors collection to avoid saving inherited data as actual data
    const rawEd = editors.find(e => e.id === ed.id) || ed;
    setEditingEd(rawEd);
    setFormData({
      name: rawEd.name || "",
      logo: rawEd.logo || "",
      website: rawEd.website || "",
      country: rawEd.country || "",
      city: rawEd.city || "",
      isStudio: rawEd.isStudio || false,
      parentCompanyId: rawEd.parentCompanyId || "",
      linkedDeveloperId: rawEd.linkedDeveloperId || "",
      studios: rawEd.studios || []
    });
    setNewStudio("");

    if (ed.parentCompanyId) {
      const parent = editors.find(e => e.id === ed.parentCompanyId);
      setParentSearch(parent ? parent.name : "");
    } else {
      setParentSearch("");
    }

    if (ed.linkedDeveloperId) {
      const dev = developers.find(d => d.id === ed.linkedDeveloperId);
      setDevSearch(dev ? dev.name : "");
    } else {
      setDevSearch("");
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Editor name is required");
      return;
    }

    try {
      const docId = editingEd.id === "new" ? null : editingEd.id;
      await saveEditor(formData, docId);
      toast.success("Editor saved successfully!");
      setEditingEd(null);
      refreshEditorsData();
    } catch (err) {
      toast.error("Failed to save editor");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this editor?")) return;
    try {
      await deleteEditorFromFirestore(id);
      toast.success("Editor deleted");
      refreshEditorsData();
    } catch (err) {
      toast.error("Failed to delete editor");
    }
  };

  const parentSuggestions = useMemo(() => {
    return editors
      .filter(ed =>
        ed.id !== editingEd?.id &&
        ed.name.toLowerCase().includes(parentSearch.toLowerCase())
      );
  }, [editors, parentSearch, editingEd]);

  const devSuggestions = useMemo(() => {
    return developers
      .filter(dev =>
        dev.name.toLowerCase().includes(devSearch.toLowerCase())
      );
  }, [developers, devSearch]);

  const filteredEditors = useMemo(() => {
    const query = debouncedSearch.toLowerCase();
    let list = editors;

    if (query) {
      list = list.filter(ed => ed.name.toLowerCase().includes(query));
    } else if (selectedLetter) {
      if (selectedLetter === "#") {
        list = list.filter(ed => /\d/.test(ed.name[0]));
      } else {
        list = list.filter(ed => ed.name[0].toUpperCase() === selectedLetter);
      }
    }

    return list
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(ed => {
        const linkedDev = ed.linkedDeveloperId ? developers.find(d => d.id === ed.linkedDeveloperId) : null;
        return {
          ...ed,
          logo: ed.logo || linkedDev?.logo,
          country: ed.country || linkedDev?.country || "",
          city: ed.city || linkedDev?.city || "",
          studios: (ed.studios && ed.studios.length > 0) ? ed.studios : (linkedDev?.studios || []),
          linkedDevName: linkedDev?.name || null,
          parentName: editors.find(e => e.id === ed.parentCompanyId)?.name || null,
          subsidiaryCount: editors.filter(e => e.parentCompanyId === ed.id).length
        };
      });
  }, [editors, developers, debouncedSearch, selectedLetter]);

  const linkedDev = useMemo(() => {
    if (!formData.linkedDeveloperId) return null;
    return developers.find(d => d.id === formData.linkedDeveloperId);
  }, [formData.linkedDeveloperId, developers]);

  const alphabet = useMemo(() => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const availableCategories = [...new Set(
      editors
        .filter(ed => ed.name && ed.name.length > 0)
        .map(ed => {
          const firstChar = ed.name[0].toUpperCase();
          return /\d/.test(firstChar) ? "#" : firstChar;
        })
    )];

    const alphaItems = letters.map(char => ({
      char,
      hasEds: availableCategories.includes(char)
    }));

    return [
      { char: "#", hasEds: availableCategories.includes("#") },
      ...alphaItems
    ];
  }, [editors]);

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
              Editor Administrator
            </h1>
            <p className="text-white/40 font-bold uppercase tracking-widest text-sm mt-2">
              Manage editors and publishers
            </p>
          </div>

          {!editingEd ? (
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 bg-gradient-primary px-6 py-3 rounded-2xl font-bold shadow-xl hover:scale-105 transition-transform"
            >
              <FaPlus /> Add New Editor
            </button>
          ) : (
            <button
              onClick={() => setEditingEd(null)}
              className="flex items-center gap-2 bg-white/10 px-6 py-3 rounded-2xl font-bold hover:bg-white/20 transition-colors"
            >
              <FiX /> Cancel
            </button>
          )}
        </header>

        {editingEd ? (
          <div className="space-y-8">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md relative z-10">
              <h2 className="text-xl font-black mb-6 flex items-center gap-3">
                <FaBuilding className="text-white/20" />
                Main Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="md:col-span-2 lg:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-3">Editor Name</label>
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
                    placeholder={linkedDev?.city ? `Inherited: ${linkedDev.city}` : "e.g. Montreal"}
                  />
                </div>
                <div className="md:col-span-1 lg:col-span-1">
                  <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-3">Country of Origin</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-white/30 font-bold"
                    placeholder={linkedDev?.country ? `Inherited: ${linkedDev.country}` : "e.g. France"}
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-3">Logo URL</label>
                  <input
                    type="text"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-white/30 font-bold"
                    placeholder={linkedDev?.logo ? "Inherited from Developer" : "https://..."}
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-3">Official Website</label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-white/30 font-bold"
                    placeholder={linkedDev?.website ? `Inherited: ${linkedDev.website}` : "https://studio-name.com"}
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-2 flex items-end">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isStudio: !formData.isStudio, parentCompanyId: !formData.isStudio ? formData.parentCompanyId : "" })}
                    className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase tracking-widest transition-all w-full border ${formData.isStudio ? "bg-gradient-primary text-white" : "bg-white/5 text-white/40"}`}
                  >
                    <FaCity />
                    {formData.isStudio ? "Internal Division Active" : "Internal Division ?"}
                  </button>
                </div>
              </div>
            </div>

            {/* Linked Developer Selection */}
            <div className={`bg-white/5 border border-white/10 rounded-3xl p-8 transition-all ${showDevSuggestions ? "relative z-30" : "relative z-10"}`}>
              <h2 className="text-xl font-black mb-2 flex items-center gap-3">
                <FaDev className="text-white/20" />
                Linked Developer
              </h2>
              <p className="text-xs text-white/40 mb-6 font-bold uppercase tracking-widest">
                Link this editor to an existing developer profile to share data
              </p>
              <div className="relative">
                <div className="relative group">
                  <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors font-bold" />
                  <input
                    type="text"
                    value={devSearch}
                    onChange={(e) => {
                      setDevSearch(e.target.value);
                      setShowDevSuggestions(true);
                    }}
                    onFocus={() => setShowDevSuggestions(true)}
                    className="w-full bg-black/20 border border-white/10 rounded-2xl pl-14 pr-6 py-4 focus:outline-none focus:border-white/30 font-bold"
                    placeholder="Search for a developer (e.g. Nintendo, Sega...)"
                  />
                </div>

                {showDevSuggestions && devSearch && (
                  <div className="absolute top-14 left-0 right-0 mt-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    {devSuggestions.length > 0 ? (
                      <div className="max-h-60 overflow-y-auto">
                        {devSuggestions.map(dev => (
                          <div
                            key={dev.id}
                            onClick={() => {
                              setFormData({ ...formData, linkedDeveloperId: dev.id });
                              setDevSearch(dev.name);
                              setShowDevSuggestions(false);
                            }}
                            className="w-full px-6 py-4 text-left hover:bg-white/10 hover:cursor-pointer flex items-center justify-between group transition-colors border-b border-white/5 last:border-0"
                          >
                            <div className="flex items-center gap-3">
                              <div className="size-8 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden">
                                {dev.logo ? <img src={dev.logo} alt={dev.name} className="w-full h-full object-cover" /> : <FaBuilding className="text-white/20" />}
                              </div>
                              <span className="font-bold">{dev.name}</span>
                            </div>
                            <span className="text-[10px] font-black uppercase text-white/40">Link profile</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-white/20 italic">No developers found</div>
                    )}
                  </div>
                )}

                {formData.linkedDeveloperId && (
                  <div className="mt-4 flex items-center gap-4 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl p-4 border border-white/10">
                    <div className="size-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                      <FaCheckCircle className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase text-white tracking-widest">Linked Developer Profile</p>
                      <p className="font-black text-lg">
                        {developers.find(d => d.id === formData.linkedDeveloperId)?.name}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setFormData({ ...formData, linkedDeveloperId: "" });
                        setDevSearch("");
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg text-white hover:text-white transition-colors"
                    >
                      <FiX />
                    </button>
                  </div>
                )}
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
                      placeholder="Search for a parent company..."
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
                        <div className="p-6 text-center text-white/20 italic">No parent editors found</div>
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
                          {editors.find(e => e.id === formData.parentCompanyId)?.name}
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
                    placeholder="e.g. Tokyo, Japan"
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
                      {linkedDev?.studios?.length > 0 ? (
                        <div className="flex flex-col gap-3">
                          <p className="text-white/20 text-[10px] font-black uppercase tracking-widest italic">Inheriting offices from developer</p>
                          <div className="flex flex-wrap justify-center gap-2">
                            {linkedDev.studios.map((s, idx) => (
                              <span key={idx} className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[10px] font-bold text-white/30 italic">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-white/20 text-xs font-black uppercase tracking-widest italic">No specific office locations added yet</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setEditingEd(null)}
                className="px-10 py-4 rounded-2xl font-black text-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-3 bg-gradient-secondary px-10 py-4 rounded-2xl font-black text-lg shadow-2xl hover:scale-105 transition-transform"
              >
                <FaSave /> Save Editor
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
                placeholder="Search editors..."
                className="w-full bg-white/5 border border-white/10 rounded-[2rem] pl-16 pr-8 py-6 focus:outline-none focus:border-white/20 font-bold text-lg backdrop-blur-md"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-1 md:gap-2 py-2">
              {alphabet.map(({ char, hasEds }) => (
                <button
                  key={char}
                  onClick={() => hasEds && handleLetterClick(char)}
                  disabled={!hasEds}
                  className={`size-8 md:size-10 rounded-xl flex items-center justify-center font-black transition-all ${hasEds
                    ? selectedLetter === char && !debouncedSearch.trim()
                      ? "bg-white text-black shadow-lg scale-110"
                      : "bg-white/5 hover:bg-white/20 hover:text-black cursor-pointer"
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
                {filteredEditors.map((ed) => (
                  <div id={`ed-${ed.id}`} key={ed.id}>
                    <EditorCard
                      ed={ed}
                      handleEdit={handleEdit}
                      handleDelete={handleDelete}
                    />
                  </div>
                ))}
              </div>
            )}

            {!loading && filteredEditors.length === 0 && (
              <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                <p className="text-white/40 text-xl font-bold italic">No editors found matching your search.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

const EditorCard = memo(({ ed, handleEdit, handleDelete }) => {
  return (
    <motion.div
      layoutId={ed.id}
      className="bg-white/5 border border-white/10 h-full rounded-3xl p-6 backdrop-blur-sm hover:border-white/20 transition-all group relative overflow-hidden flex flex-col gap-2"
    >
      <div className="flex justify-between items-start">
        <div className="size-20 flex items-center justify-center overflow-hidden bg-white/10 rounded-2xl">
          {ed.logo ? (
            <img src={ed.logo} alt={ed.name} className="w-full h-full object-contain p-2" />
          ) : (
            <FaBuilding className="text-white/20 text-2xl" />
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(ed)}
            className="p-3 bg-white/5 hover:bg-white/20 rounded-xl transition-colors text-white/40 hover:text-white"
          >
            <FaEdit size={16} />
          </button>
          <button
            onClick={() => handleDelete(ed.id)}
            className="p-3 bg-white/5 hover:bg-red-500/20 rounded-xl transition-colors text-white/40 hover:text-white"
          >
            <FaTrash size={16} />
          </button>
        </div>
      </div>

      <h3 className="text-2xl font-black">{ed.name}</h3>
      <div className="flex items-center gap-3 text-white/40 text-sm mb-6">
        <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full border border-white/5">
          <FaGlobe size={10} className="text-white/40" />
          <span className="font-bold flex items-center gap-1.5">
            {ed.country}
            {ed.city && <span className="text-white/70">• {ed.city}</span>}
          </span>
        </div>
      </div>

      {ed.studios && ed.studios.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-white/70">
              Locations ({ed.studios.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            {ed.studios.slice(0, 5).map((location, index) => (
              <span key={index} className="text-[10px] font-bold bg-white/10 border border-white/5 px-2 py-1 rounded-md text-white/70">
                {location}
              </span>
            ))}
            {ed.studios.length > 5 && (
              <span className="text-[10px] font-bold bg-white/5 border border-white/5 px-2 py-1 rounded-md text-white/20">
                +{ed.studios.length - 5} more
              </span>
            )}
          </div>
        </>
      )}

      {(ed.parentName || ed.subsidiaryCount > 0) && (
        <div className="mt-auto flex flex-col gap-2">
          {ed.parentName && (
            <div className="bg-black/20 rounded-2xl p-3 flex items-center justify-between border border-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                Parent Company
              </span>
              <span className="text-sm font-black text-white truncate ml-4">
                {ed.parentName}
              </span>
            </div>
          )}
          {ed.subsidiaryCount > 0 && (
            <div className="bg-black/20 rounded-2xl p-3 flex items-center justify-between border border-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                Subsidiaries
              </span>
              <span className="text-sm font-black text-white">
                {ed.subsidiaryCount}
              </span>
            </div>
          )}
        </div>
      )}

      {ed.linkedDevName && (
        <div className="mt-2 bg-white/10 rounded-2xl p-3 flex items-center justify-between border border-white/20">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-white">
              Linked Profile
            </span>
            <span className="text-sm font-black text-white truncate">
              {ed.linkedDevName}
            </span>
          </div>
          <FaLink className="text-primary size-3" />
        </div>
      )}
    </motion.div>
  );
});

export default AdminEditors;
