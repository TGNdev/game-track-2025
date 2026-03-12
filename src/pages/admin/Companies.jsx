import { useState, useEffect, useMemo, memo } from "react";
import Layout from "../../components/shared/Layout";
import { FaBuilding, FaPlus, FaTrash, FaSave, FaGlobe, FaCity, FaEdit, FaCheckCircle, FaHammer, FaBullhorn } from "react-icons/fa";
import { FiX, FiSearch } from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";
import { useGameData } from "../../contexts/GameDataContext";
import { Navigate, useLocation } from "react-router-dom";
import { saveCompany, deleteCompanyFromFirestore } from "../../js/firebase";
import { slugify } from "../../js/utils";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import he from "he";

export const adminConfig = {
  title: "Company Administrator",
  description: "Manage unified company profiles and their roles (developers & editors).",
  icon: FaBuilding,
  color: "from-blue-500/20 to-indigo-500/20",
  borderColor: "border-blue-500/30",
  accentColor: "text-blue-400"
};

const AdminCompanies = () => {
  const { userData, loading: authLoading } = useAuth();
  const location = useLocation();
  const { companies, loadingCompanies: loading, ensureCompaniesLoaded: fetchCompanies, refreshCompaniesData } = useGameData();
  const [searchQuery, setSearchQuery] = useState(location.state?.search || "");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [editingCompany, setEditingCompany] = useState(null);
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
    roles: ["developer"],
    parentCompanyId: "",
    studios: []
  });
  const [newStudio, setNewStudio] = useState("");
  const [parentSearch, setParentSearch] = useState("");
  const [showParentSuggestions, setShowParentSuggestions] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Set initial available letter
  useEffect(() => {
    if (companies.length > 0 && !searchQuery) {
      const availableLetters = [...new Set(
        companies
          .filter(c => c.name && c.name.length > 0)
          .map(c => {
            const firstChar = c.name[0].toUpperCase();
            return /\d/.test(firstChar) ? "#" : firstChar;
          })
      )].sort();
      if (availableLetters.length > 0 && !availableLetters.includes(selectedLetter)) {
        const priorityLetter = availableLetters.includes("A") ? "A" : availableLetters[0];
        setSelectedLetter(priorityLetter);
      }
    }
  }, [companies, searchQuery, selectedLetter]);

  const handleCreateNew = () => {
    setEditingCompany({ id: "new" });
    setFormData({
      name: "",
      logo: "",
      website: "",
      country: "",
      city: "",
      roles: ["developer"],
      parentCompanyId: "",
      studios: []
    });
    setParentSearch("");
    setNewStudio("");
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name || "",
      logo: company.logo || "",
      website: company.website || "",
      country: company.country || "",
      city: company.city || "",
      roles: company.roles || ["developer"],
      parentCompanyId: company.parentCompanyId || "",
      studios: company.studios || []
    });
    setNewStudio("");

    if (company.parentCompanyId) {
      const parent = companies.find(c => c.id === company.parentCompanyId || c.slug === company.parentCompanyId);
      setParentSearch(parent ? parent.name : "");
    } else {
      setParentSearch("");
    }
  };

  const toggleRole = (role) => {
    setFormData(prev => {
      const roles = [...prev.roles];
      if (roles.includes(role)) {
        if (roles.length > 1) {
          return { ...prev, roles: roles.filter(r => r !== role) };
        }
        return prev; // At least one role must remain
      }
      return { ...prev, roles: [...roles, role] };
    });
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Company name is required");
      return;
    }

    try {
      const docId = editingCompany.id === "new" ? null : editingCompany.id;
      
      // Auto-generate slug if not present or if name changed (for new entries primarily)
      const submitData = {
        ...formData,
        slug: slugify(formData.name)
      };

      await saveCompany(submitData, docId);
      toast.success("Company saved successfully!");
      setEditingCompany(null);
      refreshCompaniesData();
    } catch (err) {
      toast.error("Failed to save company");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this company?")) return;
    try {
      await deleteCompanyFromFirestore(id);
      toast.success("Company deleted");
      refreshCompaniesData();
    } catch (err) {
      toast.error("Failed to delete company");
    }
  };

  const parentSuggestions = useMemo(() => {
    return companies
      .filter(c =>
        c.id !== editingCompany?.id &&
        c.slug !== editingCompany?.slug &&
        c.name.toLowerCase().includes(parentSearch.toLowerCase())
      );
  }, [companies, parentSearch, editingCompany]);

  const filteredCompanies = useMemo(() => {
    const query = debouncedSearch.toLowerCase();
    let list = companies;

    if (query) {
      list = list.filter(c => c.name.toLowerCase().includes(query));
    } else if (selectedLetter) {
      if (selectedLetter === "#") {
        list = list.filter(c => /\d/.test(c.name[0]));
      } else {
        list = list.filter(c => c.name[0].toUpperCase() === selectedLetter);
      }
    }

    return list
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(company => ({
        ...company,
        parentName: companies.find(c => c.id === company.parentCompanyId || c.slug === company.parentCompanyId)?.name || null,
        subsidiaryCount: companies.filter(c => c.parentCompanyId === company.id || c.parentCompanyId === company.slug).length
      }));
  }, [companies, debouncedSearch, selectedLetter]);

  const alphabet = useMemo(() => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const availableCategories = [...new Set(
      companies
        .filter(c => c.name && c.name.length > 0)
        .map(c => {
          const firstChar = c.name[0].toUpperCase();
          return /\d/.test(firstChar) ? "#" : firstChar;
        })
    )];

    const alphaItems = letters.map(char => ({
      char,
      hasItems: availableCategories.includes(char)
    }));

    return [
      { char: "#", hasItems: availableCategories.includes("#") },
      ...alphaItems
    ];
  }, [companies]);

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
              Company Administrator
            </h1>
            <p className="text-white/40 font-bold uppercase tracking-widest text-sm mt-2">
              Manage unified company profiles and their roles
            </p>
          </div>

          {!editingCompany ? (
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 bg-gradient-primary px-6 py-3 rounded-2xl font-bold shadow-xl hover:scale-105 transition-transform"
            >
              <FaPlus /> Add New Company
            </button>
          ) : (
            <button
              onClick={() => setEditingCompany(null)}
              className="flex items-center gap-2 bg-white/10 px-6 py-3 rounded-2xl font-bold hover:bg-white/20 transition-colors"
            >
              <FiX /> Cancel
            </button>
          )}
        </header>

        {editingCompany ? (
          <div className="space-y-8">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md relative z-10">
              <h2 className="text-xl font-black mb-6 flex items-center gap-3">
                <FaBuilding className="text-white/20" />
                Main Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="md:col-span-2 lg:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-3">Company Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-white/30 font-bold text-lg"
                    placeholder="e.g. Supergiant Games"
                  />
                </div>
                <div className="md:col-span-1 lg:col-span-1">
                  <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-3">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-white/30 font-bold"
                    placeholder="e.g. San Francisco"
                  />
                </div>
                <div className="md:col-span-1 lg:col-span-1">
                  <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-3">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-white/30 font-bold"
                    placeholder="e.g. USA"
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
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="mt-8">
                <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-3">Roles</label>
                <div className="flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={() => toggleRole("developer")}
                    className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase tracking-widest transition-all border ${formData.roles.includes("developer") ? "bg-gradient-primary text-white" : "bg-white/5 text-white/40 border-white/10"}`}
                  >
                    <FaHammer /> Developer
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleRole("editor")}
                    className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase tracking-widest transition-all border ${formData.roles.includes("editor") ? "bg-gradient-primary text-white" : "bg-white/5 text-white/40 border-white/10"}`}
                  >
                    <FaBullhorn /> Editor
                  </button>
                </div>
              </div>
            </div>

            {/* Parent Company Selection */}
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
                              setFormData({ ...formData, parentCompanyId: parent.slug || parent.id });
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
                        {companies.find(c => c.id === formData.parentCompanyId || c.slug === formData.parentCompanyId)?.name}
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

            {/* Studio Locations */}
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
                    placeholder="e.g. London, UK"
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
                onClick={() => setEditingCompany(null)}
                className="px-10 py-4 rounded-2xl font-black text-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-3 bg-gradient-secondary px-10 py-4 rounded-2xl font-black text-lg shadow-2xl hover:scale-105 transition-transform"
              >
                <FaSave /> Save Company
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
                placeholder="Search companies..."
                className="w-full bg-white/5 border border-white/10 rounded-[2rem] pl-16 pr-8 py-6 focus:outline-none focus:border-white/20 font-bold text-lg backdrop-blur-md"
              />
            </div>

            {/* Alphabet Navigation */}
            <div className="flex flex-wrap justify-center gap-1 md:gap-2 py-2">
              {alphabet.map(({ char, hasItems }) => (
                <button
                  key={char}
                  onClick={() => hasItems && handleLetterClick(char)}
                  disabled={!hasItems}
                  className={`size-8 md:size-10 rounded-xl flex items-center justify-center font-black transition-all ${hasItems
                    ? selectedLetter === char && !debouncedSearch.trim()
                      ? "bg-white/10 text-white shadow-lg scale-110"
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
                {filteredCompanies.map((company) => (
                  <CompanyCard
                    key={company.id}
                    company={company}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                  />
                ))}
              </div>
            )}

            {!loading && filteredCompanies.length === 0 && (
              <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                <p className="text-white/40 text-xl font-bold italic">No companies found matching your search.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

const CompanyCard = memo(({ company, handleEdit, handleDelete }) => {
  return (
    <motion.div
      layout
      className="bg-white/5 border border-white/10 h-full rounded-3xl p-6 backdrop-blur-sm hover:border-white/20 transition-all group relative overflow-hidden flex flex-col gap-2"
    >
      <div className="flex justify-between items-start">
        <div className="size-20 flex items-center justify-center overflow-hidden bg-white/10 rounded-2xl">
          {company.logo ? (
            <img src={company.logo} alt={company.name} className="w-full h-full object-contain p-2" />
          ) : (
            <FaBuilding className="text-white/20 text-2xl" />
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(company)}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-white/40 hover:text-white"
          >
            <FaEdit size={16} />
          </button>
          <button
            onClick={() => handleDelete(company.id)}
            className="p-3 bg-white/5 hover:bg-red-500/20 rounded-xl transition-colors text-white/40 hover:text-white"
          >
            <FaTrash size={16} />
          </button>
        </div>
      </div>

      <h3 className="text-2xl font-black">{he.decode(company.name)}</h3>
      
      <div className="flex flex-wrap gap-2 mb-2">
        {company.roles?.map(role => (
          <span key={role} className="text-[10px] font-black uppercase tracking-widest bg-gradient-primary px-3 py-1 rounded-full text-white">
            {role}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3 text-white/40 text-sm mb-6">
        <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full border border-white/5">
          <FaGlobe size={10} className="text-white/40" />
          <span className="font-bold">
            {company.country}
            {company.city && <span className="text-white/70"> • {company.city}</span>}
          </span>
        </div>
      </div>

      {(company.parentName || company.subsidiaryCount > 0) && (
        <div className="mt-auto flex flex-col gap-2">
          {company.parentName && (
            <div className="bg-black/20 rounded-2xl p-3 flex items-center justify-between border border-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                Parent
              </span>
              <span className="text-sm font-black text-white truncate ml-4">
                {he.decode(company.parentName)}
              </span>
            </div>
          )}
          {company.subsidiaryCount > 0 && (
            <div className="bg-black/20 rounded-2xl p-3 flex items-center justify-between border border-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                Subsidiaries
              </span>
              <span className="text-sm font-black text-white">
                {company.subsidiaryCount}
              </span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
});

export default AdminCompanies;
