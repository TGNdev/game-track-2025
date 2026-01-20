import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { addGameToFirestore } from "../../js/firebase";
import { Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import SuggestionDropdown from "./SuggestionDropdown";
import Modal from "./Modal";
import { useGameData } from "../../contexts/GameDataContext";
import { PLATFORMS, TAGS } from "../../js/config";
import { FiTrash2 } from "react-icons/fi";

const platformOptions = Object.keys(PLATFORMS);
const platformLabels = Object.fromEntries(
  platformOptions.map((key) => [key, PLATFORMS[key].label])
);
const tagsOptions = Object.keys(TAGS);
const tagsLabels = Object.fromEntries(
  tagsOptions.map((key) => [key, TAGS[key].label])
);

const AddGameForm = ({ games, onSuccess }) => {
  const getInitialFormState = () => ({
    name: "",
    link: "",
    releaseDate: "",
    developers: [{ name: "", link: "" }],
    editors: [{ name: "", link: "" }],
    platforms: platformOptions.reduce((acc, platform) => ({ ...acc, [platform]: false }), {}),
    ratings: { critics: 0, players: 0, link: "" },
    tags: tagsOptions.reduce((acc, tag) => ({ ...acc, [tag]: false }), {}),
    cover: null,
    igdb_id: "",
  });
  const [form, setForm] = useState(getInitialFormState());
  const [errors, setErrors] = useState({});
  const [addNew, setAddNew] = useState(false);
  const [existingDevs, setExistingDevs] = useState([]);
  const [existingEditors, setExistingEditors] = useState([]);
  const [suggestionTarget, setSuggestionTarget] = useState(null);
  const [releaseTba, setReleaseTba] = useState(false);
  const navigate = useNavigate();
  const { setGames } = useGameData();

  useEffect(() => {
    const fetchData = () => {
      const devSet = new Map();
      const editorSet = new Map();

      games.forEach(game => {
        game.developers.forEach(dev => dev.name && devSet.set(dev.name, dev.link));
        game.editors.forEach(editor => editor.name && editorSet.set(editor.name, editor.link));
      })

      setExistingDevs(Array.from(devSet.entries()).map(([name, link]) => ({ name, link })));
      setExistingEditors(Array.from(editorSet.entries()).map(([name, link]) => ({ name, link })));
    };

    fetchData();
  }, [games]);

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

  const addEntry = (type) => {
    setForm({ ...form, [type]: [...form[type], { name: "", link: "" }] });
  };

  const removeEntry = (type, index) => {
    const updated = form[type].filter((_, i) => i !== index);
    setForm({ ...form, [type]: updated });
  }

  const updateEntry = (type, index, field, value) => {
    const updated = [...form[type]];
    updated[index][field] = value;
    setForm({ ...form, [type]: updated });
  };

  const validate = () => {
    const errs = {};
    if (!form.name) errs.name = "Name is required";
    if (!form.link) errs.link = "Link is required";
    if (form.developers.length === 0) errs.developers = "Enter at least one developer";
    if (form.developers.some(dev => !dev.name || !dev.link)) {
      errs.developers = "All developers must have a name and a link";
    }
    if (form.editors.length === 0) errs.editors = "Enter at least one editor";
    if (form.editors.some(ed => !ed.name || !ed.link)) {
      errs.editors = "All editors must have a name and a link";
    }
    if (!form.releaseDate) errs.releaseDate = "Release date is required";
    if (!form.igdb_id) errs.igdb_id = "IGDB game ID is required";
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

      const newGameId = await addGameToFirestore({
        name: form.name,
        link: form.link,
        release_date: releaseDate,
        developers: form.developers,
        editors: form.editors,
        platforms: form.platforms,
        ratings: normalizedRatings,
        tags: form.tags,
        cover: null,
        igdb_id: form.igdb_id,
      });

      const newGameObject = {
        id: newGameId,
        name: form.name,
        link: form.link,
        release_date: releaseDate,
        developers: form.developers,
        editors: form.editors,
        platforms: form.platforms,
        ratings: normalizedRatings,
        tags: form.tags,
        cover: null,
        igdb_id: form.igdb_id,
      };

      setGames((prevGames) => [...prevGames, newGameObject]);

      toast.success("Game added successfully!");

      if (!addNew) {
        if (onSuccess) onSuccess();
        navigate("/");
      }

      setForm(getInitialFormState());
      setAddNew(false);
    } catch (err) {
      console.error("Failed to add game:", err);
      toast.error(err.message || "Failed to add game.");
    }
  };

  return (
    <Modal title={"Add a new game"}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col">
            <label className="text-xs font-black uppercase tracking-widest text-white/40 mb-2 ml-1">Game Name</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all"
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
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all font-mono text-sm"
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
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all"
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
        <div className="space-y-4 pt-4 border-t border-white/5">
          <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1 block">Developers</label>
          <div className="space-y-3">
            {form.developers.map((dev, i) => (
              <div key={i} className="flex flex-row gap-3 items-center group">
                <div className={`relative flex-1 ${suggestionTarget?.type === "developers" && suggestionTarget?.index === i ? "z-50" : ""}`}>
                  <input
                    placeholder="Studio Name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary/50 transition-all"
                    value={dev.name}
                    onFocus={() => {
                      if (!dev.name) setSuggestionTarget({ type: "developers", index: i, field: "name" });
                    }}
                    onChange={(e) => updateEntry("developers", i, "name", e.target.value)}
                  />
                  {suggestionTarget?.type === "developers" &&
                    suggestionTarget?.index === i &&
                    suggestionTarget?.field === "name" && (
                      <SuggestionDropdown
                        suggestions={existingDevs}
                        value={dev.name}
                        onSelect={(selected) => {
                          updateEntry("developers", i, "name", selected.name);
                          updateEntry("developers", i, "link", selected.link);
                          setSuggestionTarget(null);
                        }}
                      />
                    )}
                </div>
                <input
                  placeholder="Website"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-primary/50 transition-all"
                  value={dev.link}
                  onChange={(e) => updateEntry("developers", i, "link", e.target.value)}
                />
                <button
                  type="button"
                  className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500/20 transition-all active:scale-95"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeEntry("developers", i)
                  }}
                >
                  <FiTrash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => addEntry("developers")}
            className="text-[10px] font-black uppercase tracking-widest text-primary-light hover:text-primary transition-colors ml-1"
          >
            + Add Developer
          </button>
          {errors.developers && <div className="text-red-500 text-xs font-bold ml-1">{errors.developers}</div>}
        </div>

        <div className="space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1 block">Publishers</label>
          <div className="space-y-3">
            {form.editors.map((ed, i) => (
              <div key={i} className="flex flex-row gap-3 items-center group">
                <div className={`relative flex-1 ${suggestionTarget?.type === "editors" && suggestionTarget?.index === i ? "z-50" : ""}`}>
                  <input
                    placeholder="Company Name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary/50 transition-all"
                    value={ed.name}
                    onFocus={() => {
                      if (!ed.name) setSuggestionTarget({ type: "editors", index: i, field: "name" });
                    }}
                    onChange={(e) => updateEntry("editors", i, "name", e.target.value)}
                  />
                  {suggestionTarget?.type === "editors" &&
                    suggestionTarget?.index === i &&
                    suggestionTarget?.field === "name" && (
                      <SuggestionDropdown
                        suggestions={existingEditors}
                        value={ed.name}
                        onSelect={(selected) => {
                          updateEntry("editors", i, "name", selected.name);
                          updateEntry("editors", i, "link", selected.link);
                          setSuggestionTarget(null);
                        }}
                      />
                    )}
                </div>
                <input
                  placeholder="Website"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-primary/50 transition-all"
                  value={ed.link}
                  onChange={(e) => updateEntry("editors", i, "link", e.target.value)}
                />
                <button
                  type="button"
                  className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500/20 transition-all active:scale-95"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeEntry("editors", i)
                  }}
                >
                  <FiTrash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => addEntry("editors")}
            className="text-[10px] font-black uppercase tracking-widest text-primary-light hover:text-primary transition-colors ml-1"
          >
            + Add Publisher
          </button>
          {errors.editors && <div className="text-red-500 text-xs font-bold ml-1">{errors.editors}</div>}
        </div>
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
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all font-black text-xl"
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
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all font-black text-xl"
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
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-mono focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5">
          <label className="text-xs font-black uppercase tracking-widest text-white/40 mb-2 ml-1 block">IGDB ID</label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-primary/50 transition-all"
            name="igdb_id"
            value={form.igdb_id}
            placeholder="e.g. 119171"
            onChange={handleChange}
          />
          {errors.igdb_id && <div className="text-red-500 text-xs font-bold mt-1 ml-1">{errors.igdb_id}</div>}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8 pt-4 border-t border-white/10">
          <button
            type="submit"
            className="bg-white/5 border border-white/10 py-4 rounded-xl text-white font-black uppercase tracking-widest shadow-xl hover:bg-white/10 transition-all active:scale-[0.98]"
          >
            Create
          </button>
          <button
            type="submit"
            className="bg-gradient-primary py-4 rounded-xl text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            onClick={() => setAddNew(true)}
          >
            Add & Reset
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddGameForm;
