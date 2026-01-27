import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../components/shared/Layout";
import { useGameData } from "../contexts/GameDataContext";
import WatchCard from "../components/watch/WatchCard";
import WatchModal from "../components/watch/WatchModal";
import { addWatchToFirestore, editWatchFromFirestore, deleteWatchFromFirestore } from "../js/firebase";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiActivity, FiSearch, FiFrown } from "react-icons/fi";
import ConfirmModal from "../components/modals/ConfirmModal";
import { useAuth } from "../contexts/AuthContext";

const IndustryWatch = () => {
  const { watch, setWatch, loadingWatch, ensureWatchLoaded } = useGameData();
  const { userData } = useAuth();
  const [searchParams] = useSearchParams();
  const targetId = searchParams.get("id");
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState(null);

  useEffect(() => {
    ensureWatchLoaded();
  }, [ensureWatchLoaded]);

  useEffect(() => {
    if (!loadingWatch && targetId) {
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, [loadingWatch, targetId]);

  const filteredArticles = useMemo(() => {
    if (!watch) return [];

    const sorted = [...watch].sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    if (!searchTerm) return sorted;

    const s = searchTerm.toLowerCase();
    return sorted.filter(a =>
      a.title.toLowerCase().includes(s) ||
      a.summary.toLowerCase().includes(s) ||
      a.author.toLowerCase().includes(s) ||
      a.gameName?.toLowerCase().includes(s)
    );
  }, [watch, searchTerm]);

  const handleSave = async (data) => {
    try {
      data.summary = data.summary.replace(/&nbsp;/g, " ");

      if (editingArticle) {
        await editWatchFromFirestore(editingArticle.id, data);
        setWatch(prev => prev.map(a => a.id === editingArticle.id ? { ...a, ...data } : a));
        toast.success("Article updated successfully!");
      } else {
        const newId = await addWatchToFirestore(data);
        const newArticle = { id: newId, ...data, createdAt: new Date().toISOString() };
        setWatch(prev => [newArticle, ...prev]);
        toast.success("Article published to the Watch!");
      }
    } catch (e) {
      toast.error("An error occurred. Please try again.");
      console.error(e);
    }
    setEditingArticle(null);
  };

  const handleDelete = async () => {
    if (!articleToDelete) return;
    try {
      await deleteWatchFromFirestore(articleToDelete);
      setWatch(prev => prev.filter(a => a.id !== articleToDelete));
      toast.info("Article removed from the Watch.");
    } catch (e) {
      toast.error("Failed to delete article.");
    }
    setDeleteConfirmOpen(false);
    setArticleToDelete(null);
  };

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-6 pb-12 md:py-20 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-primary-light">
              <div className="size-10 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-[0_0_20px_rgba(176,105,255,0.4)]">
                <FiActivity size={24} className="text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                Industry Watch
              </h1>
            </div>
            <p className="text-white/40 font-medium max-w-xl text-lg leading-relaxed">
              Insider rumors, studio movements, and major industry shifts—curated and summarized for you.
            </p>
          </div>

        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-end">
          <div className="relative w-full sm:w-80 group">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary-light transition-colors" />
            <input
              type="text"
              placeholder="Search news..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all shadow-xl"
            />
          </div>
          {userData?.isAdmin && (
            <button
              onClick={() => {
                setEditingArticle(null);
                setModalOpen(true);
              }}
              className="whitespace-nowrap px-6 py-4 bg-gradient-primary rounded-2xl text-white font-black uppercase tracking-widest flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-[0_10px_20px_rgba(176,105,255,0.3)]"
            >
              <FiPlus size={20} />
              <span>Add News</span>
            </button>
          )}
        </div>
        <div className="relative min-h-[400px]">
          {loadingWatch ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-80 bg-white/5 border border-white/10 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredArticles.map(article => (
                  <WatchCard
                    key={article.id}
                    article={article}
                    isHighlighted={article.id === targetId}
                    canEdit={userData?.isAdmin}
                    onEdit={(a) => {
                      setEditingArticle(a);
                      setModalOpen(true);
                    }}
                    onDelete={(id) => {
                      setArticleToDelete(id);
                      setDeleteConfirmOpen(true);
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm"
            >
              <div className="p-6 bg-white/5 rounded-full">
                <FiFrown size={48} className="text-white/20" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-white">No news found</h3>
                <p className="text-white/40 font-medium tracking-wide prose max-w-xs mx-auto">
                  Try adjusting your search terms or check back later for updates.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <WatchModal
        key={editingArticle?.id || "new"}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingArticle(null);
        }}
        onSave={handleSave}
        initialData={editingArticle}
      />

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Article"
        message="Are you sure you want to remove this news from the watch? This action cannot be undone."
      />
    </Layout>
  );
};

export default IndustryWatch;
