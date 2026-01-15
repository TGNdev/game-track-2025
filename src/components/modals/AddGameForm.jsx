import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { addGameToFirestore } from "../../js/firebase";
import { Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import SuggestionDropdown from "./SuggestionDropdown";
import Modal from "./Modal";
import { PLATFORMS, TAGS } from "../../js/config";
import { FaTrash } from "react-icons/fa";

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

      await addGameToFirestore({
        name: form.name,
        link: form.link,
        release_date: releaseDate,
        developers: form.developers,
        editors: form.editors,
        platforms: form.platforms,
        ratings: form.ratings,
        tags: form.tags,
        cover: null,
        igdb_id: form.igdb_id,
      });

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
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <label className="block text-sm mb-2 font-semibold">Name</label>
            <input
              className="px-4 py-2 rounded border bg-background"
              name="name"
              value={form.name}
              placeholder="with full notation (don't forget ':' or correct numbering such as 'VI' or '6')"
              onChange={handleChange}
            />
            {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
          </div>
          <div className="flex flex-col">
            <label className="block text-sm mb-2 font-semibold">Link</label>
            <input
              className="px-4 py-2 rounded border bg-background"
              name="link"
              placeholder="Game website (or IGN page if no website)"
              value={form.link}
              onChange={handleChange}
            />
            {errors.link && <span className="text-red-500 text-sm">{errors.link}</span>}
          </div>
          <div className="flex flex-col">
            <label className="block text-sm mb-2 font-semibold">Release date</label>
            <div className="flex flex-row justify-between gap-4">
              <input
                type={`${releaseTba ? "text" : "date"}`}
                placeholder={`${releaseTba && "'TBA 2026' or 'Q4 2025'"}`}
                name="releaseDate"
                className="px-4 py-2 rounded border bg-background w-full"
                value={form.releaseDate}
                onChange={handleChange}
              />
              <button
                type="button"
                className="px-3 py-1.5 min-w-fit bg-gradient-primary rounded-md text-sm"
                onClick={() => setReleaseTba(prev => !prev)}
              >
                {releaseTba ? "Date" : "TBA"}
              </button>
            </div>
            {errors.releaseDate && <span className="text-red-500 text-sm">{errors.releaseDate}</span>}
          </div>
          <div>
            <label className="block text-sm mb-2 font-semibold">Tags</label>
            <div className="flex flex-wrap gap-2">
              {tagsOptions.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 rounded-full text-sm ${form.tags[tag] ? "bg-gradient-primary" : ""
                    }`}
                >
                  {tagsLabels[tag]}
                </button>
              ))}
            </div>
            {errors.tags && <span className="text-red-500 text-sm">{errors.tags}</span>}
          </div>
        </div>
        <div>
          <label className="block text-sm mb-2 font-semibold">Developers</label>
          {form.developers.map((dev, i) => (
            <div key={i} className="flex flex-row gap-2 mb-2 items-center">
              <div className="relative w-full">
                <input
                  placeholder="Name"
                  className="px-4 py-2 rounded border w-full bg-background"
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
                placeholder="Link"
                className="px-4 py-2 rounded border w-full bg-background"
                value={dev.link}
                onChange={(e) => updateEntry("developers", i, "link", e.target.value)}
              />
              <button
                type="button"
                className="text-sm bg-gradient-red rounded-md p-2"
                onClick={(e) => {
                  e.stopPropagation();
                  removeEntry("developers", i)
                }}
              >
                <FaTrash className="size-4" />
              </button>
            </div>
          ))}
          <div className="flex flex-col gap-2 items-start">
            <button
              type="button"
              onClick={() => addEntry("developers")}
              className="text-sm bg-gradient-primary rounded-md px-2 py-1.5"
            >
              Add one more
            </button>
            {errors.developers && <span className="text-red-500 text-sm">{errors.developers}</span>}
          </div>
        </div>
        <div>
          <label className="block text-sm mb-2 font-semibold">Editors</label>
          {form.editors.map((ed, i) => (
            <div key={i} className="flex flex-row gap-2 mb-2 items-center">
              <div className="relative w-full">
                <input
                  placeholder="Name"
                  className="px-4 py-2 rounded border w-full bg-background"
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
                placeholder="Link"
                className="px-4 py-2 rounded border w-full bg-background"
                value={ed.link}
                onChange={(e) => updateEntry("editors", i, "link", e.target.value)}
              />
              <button
                type="button"
                className="text-sm bg-gradient-red rounded-md p-2"
                onClick={(e) => {
                  e.stopPropagation();
                  removeEntry("editors", i)
                }}
              >
                <FaTrash className="size-4" />
              </button>
            </div>
          ))}
          <div className="flex flex-col gap-2 items-start">
            <button
              type="button"
              onClick={() => addEntry("editors")}
              className="text-sm bg-gradient-primary rounded-md px-2 py-1.5"
            >
              Add one more
            </button>
            {errors.editors && <span className="text-red-500 text-sm">{errors.editors}</span>}
          </div>
        </div>
        <div>
          <label className="block text-sm mb-2 font-semibold">Platforms</label>
          <div className="flex flex-wrap gap-2">
            {platformOptions.map((platform) => (
              <button
                type="button"
                key={platform}
                onClick={() => handlePlatformToggle(platform)}
                className={`px-3 py-1 rounded-full text-sm ${form.platforms[platform] ? "bg-gradient-primary text-white" : ""
                  }`}
              >
                {platformLabels[platform]}
              </button>
            ))}
          </div>
          {errors.platforms && <span className="text-red-500 text-sm">{errors.platforms}</span>}
        </div>
        <div>
          <label className="block text-sm mb-2 font-semibold">Ratings</label>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-xs mb-1" htmlFor="ratings.critics">Critics</label>
              <input
                id="ratings.critics"
                name="ratings.critics"
                type="number"
                placeholder="Critic Rating"
                value={form.ratings.critics}
                onChange={handleChange}
                className="px-3 py-2 rounded border bg-background"
                min={0}
                max={100}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs mb-1" htmlFor="ratings.players">Players</label>
              <input
                id="ratings.players"
                name="ratings.players"
                type="number"
                placeholder="Players Rating"
                value={form.ratings.players}
                onChange={handleChange}
                className="px-3 py-2 rounded border bg-background"
                min={0}
                max={100}
              />
            </div>
            <div className="flex flex-col col-span-2">
              <label className="text-xs mb-1" htmlFor="ratings.link">OpenCritic link</label>
              <input
                id="ratings.link"
                name="ratings.link"
                type="text"
                value={form.ratings.link}
                onChange={handleChange}
                className="px-3 py-2 rounded border bg-background"
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <label className="block text-sm mb-2 font-semibold">IGDB game ID</label>
          <input
            className="px-4 py-2 rounded border bg-background"
            name="igdb_id"
            value={form.igdb_id}
            placeholder="something like 345678"
            onChange={handleChange}
          />
          {errors.igdb_id && <span className="text-red-500 text-sm">{errors.igdb_id}</span>}
        </div>
        <div className="flex flex-row gap-3">
          <button
            type="submit"
            className="rounded-md px-3 py-1.5 bg-gradient-primary"
          >
            Add and go back
          </button>
          <button
            type="submit"
            className="rounded-md px-3 py-1.5 bg-gradient-primary"
            onClick={() => setAddNew(true)}
          >
            Add and reset form
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddGameForm;
