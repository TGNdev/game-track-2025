import { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import { editGameFromFirestore } from "../../js/firebase";
import { Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import SuggestionDropdown from "./SuggestionDropdown";
import isEqual from "lodash.isequal";
import Modal from "./Modal";
import { useGameData } from "../../contexts/GameDataContext";
import { PLATFORMS, TAGS } from "../../js/config";
import { FiTrash2, FiPlusCircle, FiSearch } from "react-icons/fi";
import { FaBuilding } from "react-icons/fa";
import QuickDeveloperModal from "./QuickDeveloperModal";

const platformOptions = Object.keys(PLATFORMS);
const platformLabels = Object.fromEntries(
  platformOptions.map((key) => [key, PLATFORMS[key].label])
);
const tagsOptions = Object.keys(TAGS);
const tagsLabels = Object.fromEntries(
  tagsOptions.map((key) => [key, TAGS[key].label])
);

const EditGameForm = ({ game, games, onSuccess }) => {
  const getInitialFormState = () => ({
    name: game.name || "",
    link: game.link || "",
    releaseDate:
      typeof game.release_date === "string"
        ? game.release_date
        : game.release_date?.toDate().toISOString().split("T")[0] || "",
    developers: game.developers || [],
    editors: game.editors || [],
    platforms: game.platforms || platformOptions.reduce((acc, p) => ({ ...acc, [p]: false }), {}),
    ratings: game.ratings || { critics: 0, players: 0, link: "" },
    tags: game.tags || tagsOptions.reduce((acc, tag) => ({ ...acc, [tag]: false }), {}),
    cover: game.cover || null,
    developerRefs: game.developerRefs || [],
    editorRefs: game.editorRefs || [],
  });

  const [form, setForm] = useState(getInitialFormState());
  const [originalData] = useState(getInitialFormState());
  const [hasChanges, setHasChanges] = useState(false);
  const [quickDevModal, setQuickDevModal] = useState({ isOpen: false, type: "", initialName: "" });
  const [errors, setErrors] = useState({});
  const [devSearch, setDevSearch] = useState("");
  const [editorSearch, setEditorSearch] = useState("");
  const [suggestionTarget, setSuggestionTarget] = useState(null);
  const [releaseTba, setReleaseTba] = useState(typeof game.release_date === "string");
  const navigate = useNavigate();
  const {
    setGames,
    companies,
    ensureCompaniesLoaded
  } = useGameData();

  useEffect(() => {
    ensureCompaniesLoaded();
  }, [ensureCompaniesLoaded]);

  const existingDevs = useMemo(() => {
    return companies.filter(c => c.roles?.includes('developer')).map(d => ({ ...d, name: d.name, link: d.website }));
  }, [companies]);

  const existingEditors = useMemo(() => {
    return companies.filter(c => c.roles?.includes('editor')).map(e => ({ ...e, name: e.name, link: e.website || (typeof e.link === 'string' ? e.link : "") }));
  }, [companies]);

  useEffect(() => {
    setHasChanges(!isEqual(form, originalData));
  }, [form, originalData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes("ratings.")) {
      const field = name.split(".")[1];
      setForm({ ...form, ratings: { ...form.ratings, [field]: value } });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handlePlatformToggle = (platform) => {
    setForm((prev) => ({
      ...prev,
      platforms: {
        ...prev.platforms,
        [platform]: !prev.platforms[platform],
      },
    }));
  };

  const handleTagToggle = (tag) => {
    setForm((prev) => ({
      ...prev,
      tags: {
        ...prev.tags,
        [tag]: !prev.tags[tag],
      },
    }));
  };

  const handleEntitySelect = (type, entity) => {
    const refType = type === "developers" ? "developerRefs" : "editorRefs";
    const legacyType = type === "developers" ? "developers" : "editors";
    const setSearch = type === "developers" ? setDevSearch : setEditorSearch;

    if (form[refType].some(ref => (typeof ref === 'string' ? ref : ref.devId) === (entity.slug || entity.id))) {
      toast.info(`${entity.name} is already added.`);
      setSearch("");
      setSuggestionTarget(null);
      return;
    }

    setForm(prev => ({
      ...prev,
      [refType]: [...prev[refType], { devId: entity.slug || entity.id }],
      [legacyType]: [...prev[legacyType], { name: entity.name, link: entity.website || entity.link || "" }]
    }));

    setSearch("");
    setSuggestionTarget(null);
  };

  const removeEntity = (type, index) => {
    const refType = type === "developers" ? "developerRefs" : "editorRefs";
    const legacyType = type === "developers" ? "developers" : "editors";
    setForm(prev => ({
      ...prev,
      [refType]: prev[refType].filter((_, i) => i !== index),
      [legacyType]: prev[legacyType].filter((_, i) => i !== index)
    }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name) errs.name = "Name is required";
    if (!form.link) errs.link = "Link is required";
    // For legacy games, we might not have refs yet, so check both or at least one
    if (form.developerRefs.length === 0 && form.developers.length === 0) {
      errs.developers = "Select or enter at least one developer";
    }
    if (form.editorRefs.length === 0 && form.editors.length === 0) {
      errs.editors = "Select or enter at least one publisher";
    }
    if (!form.releaseDate) errs.releaseDate = "Release date is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const isValidDate = dateRegex.test(form.releaseDate) && !isNaN(Date.parse(form.releaseDate));
      const releaseDate = isValidDate
        ? Timestamp.fromDate(new Date(form.releaseDate))
        : form.releaseDate;

      const normalizedRatings = {
        critics: Number(form.ratings.critics) || 0,
        players: Number(form.ratings.players) || 0,
        link: form.ratings.link || "",
      };

      await editGameFromFirestore(game.id, {
        name: form.name,
        link: form.link,
        release_date: releaseDate,
        developers: form.developers,
        editors: form.editors,
        developerRefs: form.developerRefs.filter(Boolean),
        editorRefs: form.editorRefs.filter(Boolean),
        platforms: form.platforms,
        ratings: normalizedRatings,
        tags: form.tags,
        cover: form.cover,
      });

      const updatedGame = {
        ...game,
        id: game.id,
        name: form.name,
        link: form.link,
        release_date: releaseDate,
        developers: form.developers,
        editors: form.editors,
        developerRefs: form.developerRefs.filter(Boolean),
        editorRefs: form.editorRefs.filter(Boolean),
        platforms: form.platforms,
        ratings: normalizedRatings,
        tags: form.tags,
        cover: form.cover ?? null,
      };

      setGames(prevGames =>
        prevGames.map(g => (g.id === game.id ? updatedGame : g))
      );

      toast.success("Game updated successfully!");
      if (onSuccess) onSuccess();
      navigate("/");
    } catch (err) {
      console.error("Error updating game:", err);
      toast.error("Failed to update game.");
    }
  };

  return (
    <Modal title={`Edit ${game.name}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Info */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col">
            <label className="text-xs font-black uppercase tracking-widest text-white/40 mb-2 ml-1">Game Name</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#b069ff]/50 transition-all font-bold"
              name="name"
              value={form.name}
              placeholder="e.g. Final Fantasy VII Rebirth"
              onChange={handleChange}
            />
            {errors.name && <span className="text-red-500 text-xs font-bold mt-1 ml-1">{errors.name}</span>}
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-black uppercase tracking-widest text-white/40 mb-2 ml-1">Website Link</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#b069ff]/50 transition-all font-mono text-sm"
              name="link"
              placeholder="https://..."
              value={form.link}
              onChange={handleChange}
            />
            {errors.link && <span className="text-red-500 text-xs font-bold mt-1 ml-1">{errors.link}</span>}
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-black uppercase tracking-widest text-white/40 mb-2 ml-1">Release date</label>
            <div className="flex flex-row justify-between gap-3">
              <input
                type={`${releaseTba ? "text" : "date"}`}
                placeholder={`${releaseTba ? "'TBA 2026' or 'Q4 2025'" : ""}`}
                name="releaseDate"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#b069ff]/50 transition-all"
                value={form.releaseDate}
                onChange={handleChange}
              />
              <button
                type="button"
                className={`px-4 py-1.5 min-w-[70px] rounded-xl text-xs font-black uppercase tracking-widest transition-all ${releaseTba ? "bg-gradient-primary text-white" : "bg-white/5 border border-white/10 text-white/40"}`}
                onClick={() => setReleaseTba(prev => !prev)}
              >
                TBA
              </button>
            </div>
            {errors.releaseDate && <span className="text-red-500 text-xs font-bold mt-1 ml-1">{errors.releaseDate}</span>}
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-widest text-white/40 mb-3 ml-1 block">Genre Tags</label>
            <div className="flex flex-wrap gap-2">
              {tagsOptions.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${form.tags[tag]
                    ? "bg-gradient-primary text-white shadow-lg shadow-primary/20 scale-105"
                    : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
                    }`}
                >
                  {tagsLabels[tag]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Developers */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1 block">Developers</label>

          <div className="flex flex-wrap gap-2">
            {/* Legacy Developers (if any) */}
            {form.developers.filter((_, idx) => !form.developerRefs[idx]).map((dev, i) => (
              <div key={`legacy-dev-${i}`} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 opacity-60">
                <span className="text-xs text-white/40 uppercase font-black">Legacy</span>
                <span className="text-sm font-bold text-white/80">{dev.name}</span>
                <button type="button" onClick={() => removeEntity("developers", i)} className="p-1 hover:bg-red-500/20 text-white/20 hover:text-red-500 rounded-md">
                  <FiTrash2 size={12} />
                </button>
              </div>
            ))}

            {/* Referenced Developers */}
            {form.developerRefs.map((ref, i) => {
              const devId = typeof ref === 'string' ? ref : ref?.devId;
              const dev = companies.find(d => d.id === devId || d.slug === devId);
              return (
                <div key={devId} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 group/tag shadow-sm">
                  <div className="size-6 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                    {dev?.logo ? (
                      <img src={dev.logo} alt="" className="w-full h-full object-contain p-1" />
                    ) : (
                      <FaBuilding className="text-white/20 text-[10px]" />
                    )}
                  </div>
                  <span className="text-sm font-bold text-white/80">{dev?.name || "Unknown"}</span>
                  <button
                    type="button"
                    onClick={() => removeEntity("developers", i)}
                    className="p-1 hover:bg-red-500/20 text-white/20 hover:text-red-500 rounded-md transition-all"
                  >
                    <FiTrash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="relative z-50">
            <div className="relative group">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" />
              <input
                placeholder="Search and add studios..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-3 text-white text-sm focus:outline-none focus:border-[#b069ff]/50 transition-all font-bold"
                value={devSearch}
                onFocus={() => {
                  setSuggestionTarget({ type: "developers" });
                }}
                onChange={(e) => setDevSearch(e.target.value)}
              />
              {devSearch && (
                <button
                  type="button"
                  onClick={() => setQuickDevModal({ isOpen: true, type: "developers", initialName: devSearch })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                  title="Quick create this profile"
                >
                  <FiPlusCircle size={16} />
                </button>
              )}
            </div>
            {suggestionTarget?.type === "developers" && (
              <SuggestionDropdown
                suggestions={existingDevs}
                value={devSearch}
                onSelect={(selected) => handleEntitySelect("developers", selected)}
              />
            )}
          </div>
          {errors.developers && <div className="text-red-500 text-xs font-bold ml-1">{errors.developers}</div>}
        </div>

        <div className="space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1 block">Publishers</label>

          <div className="flex flex-wrap gap-2">
            {/* Legacy Editors (if any) */}
            {form.editors.filter((_, idx) => !form.editorRefs[idx]).map((ed, i) => (
              <div key={`legacy-ed-${i}`} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 opacity-60">
                <span className="text-xs text-white/40 uppercase font-black">Legacy</span>
                <span className="text-sm font-bold text-white/80">{ed.name}</span>
                <button type="button" onClick={() => removeEntity("editors", i)} className="p-1 hover:bg-red-500/20 text-white/20 hover:text-red-500 rounded-md">
                  <FiTrash2 size={12} />
                </button>
              </div>
            ))}

            {/* Referenced Editors */}
            {form.editorRefs.map((ref, i) => {
              const edId = typeof ref === 'string' ? ref : ref?.devId;
              const ed = companies.find(e => e.id === edId || e.slug === edId);
              return (
                <div key={edId} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 group/tag shadow-sm">
                  <div className="size-6 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                    {ed?.logo ? (
                      <img src={ed.logo} alt="" className="w-full h-full object-contain p-1" />
                    ) : (
                      <FaBuilding className="text-white/20 text-[10px]" />
                    )}
                  </div>
                  <span className="text-sm font-bold text-white/80">{ed?.name || "Unknown"}</span>
                  <button
                    type="button"
                    onClick={() => removeEntity("editors", i)}
                    className="p-1 hover:bg-red-500/20 text-white/20 hover:text-red-500 rounded-md transition-all"
                  >
                    <FiTrash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="relative z-40">
            <div className="relative group">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" />
              <input
                placeholder="Search and add publishers..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-3 text-white text-sm focus:outline-none focus:border-[#b069ff]/50 transition-all font-bold"
                value={editorSearch}
                onFocus={() => {
                  setSuggestionTarget({ type: "editors" });
                }}
                onChange={(e) => setEditorSearch(e.target.value)}
              />
              {editorSearch && (
                <button
                  type="button"
                  onClick={() => setQuickDevModal({ isOpen: true, type: "editors", initialName: editorSearch })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                  title="Quick create this profile"
                >
                  <FiPlusCircle size={16} />
                </button>
              )}
            </div>
            {suggestionTarget?.type === "editors" && (
              <SuggestionDropdown
                suggestions={existingEditors}
                value={editorSearch}
                onSelect={(selected) => handleEntitySelect("editors", selected)}
              />
            )}
          </div>
          {errors.editors && <div className="text-red-500 text-xs font-bold ml-1">{errors.editors}</div>}
        </div>

        {/* Platforms */}
        <div className="pt-4 border-t border-white/5">
          <label className="text-xs font-black uppercase tracking-widest text-white/40 mb-3 ml-1 block">Platforms</label>
          <div className="flex flex-wrap gap-2">
            {platformOptions.map((platform) => (
              <button
                type="button"
                key={platform}
                onClick={() => handlePlatformToggle(platform)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${form.platforms[platform]
                  ? "bg-gradient-primary text-white shadow-lg shadow-primary/20 scale-105"
                  : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
                  }`}
              >
                {platformLabels[platform]}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-white/5">
          <label className="text-xs font-black uppercase tracking-widest text-white/40 mb-4 ml-1 block">Ratings & Metadata</label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Critics</label>
              <input
                name="ratings.critics"
                type="number"
                placeholder="0"
                value={form.ratings.critics}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#b069ff]/50 transition-all font-black text-xl"
                min={0}
                max={100}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Players</label>
              <input
                name="ratings.players"
                type="number"
                placeholder="0"
                value={form.ratings.players}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#b069ff]/50 transition-all font-black text-xl"
                min={0}
                max={100}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">OpenCritic Link</label>
              <input
                name="ratings.link"
                type="text"
                value={form.ratings.link}
                onChange={handleChange}
                placeholder="https://opencritic.com/game/..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-mono focus:outline-none focus:border-[#b069ff]/50 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10">
          {hasChanges && (
            <button
              type="submit"
              className="w-full bg-gradient-primary py-4 rounded-xl text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Save Changes
            </button>
          )}
        </div>
      </form>
      <QuickDeveloperModal
        isOpen={quickDevModal.isOpen}
        initialName={quickDevModal.initialName}
        onClose={() => setQuickDevModal({ ...quickDevModal, isOpen: false })}
        onCreated={(newDev) => {
          handleEntitySelect(quickDevModal.type, newDev);
        }}
      />
    </Modal>
  );
};

export default EditGameForm;
