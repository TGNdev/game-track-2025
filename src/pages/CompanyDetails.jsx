import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useGameData } from "../contexts/GameDataContext";
import Layout from "../components/shared/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { FaBuilding, FaGlobe, FaCity, FaArrowLeft, FaExternalLinkAlt, FaGamepad, FaHammer, FaBullhorn } from "react-icons/fa";
import { AiFillEdit } from "react-icons/ai";
import { useAuth } from "../contexts/AuthContext";
import he from "he";
import CompactGameCard from "../components/games/CompactGameCard";
import { getGameCovers } from "../js/igdb";

const CompanyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState("produced");
  const {
    companies,
    games,
    loadingCompanies,
    loadingGames,
    ensureCompaniesLoaded,
    coverMap,
    setCoverMap
  } = useGameData();

  useEffect(() => {
    ensureCompaniesLoaded();
  }, [ensureCompaniesLoaded]);

  // Resolve the entity and its combined data
  const entity = useMemo(() => {
    if (loadingCompanies) return null;

    // Search by slug exactly, or by ID as fallback (forward compatibility)
    const company = companies.find(c => c.slug === id || c.id === id || c.allIds?.includes(id));
    if (!company) return null;

    return company;
  }, [companies, id, loadingCompanies]);

  const { developedGames, publishedGames } = useMemo(() => {
    if (!entity) return { developedGames: [], publishedGames: [] };

    const developed = [];
    const published = [];

    games.forEach(game => {
      const isDeveloper = game.developerRefs?.some(ref => {
        const devId = typeof ref === 'object' ? ref.devId : ref;
        // Check canonical slug, internal ID, or any of the merged IDs
        return devId === entity.slug || devId === entity.id || entity.allIds?.includes(devId);
      });
      const isEditor = game.editorRefs?.some(ref => {
        const edId = typeof ref === 'object' ? ref.devId : ref;
        return edId === entity.slug || edId === entity.id || entity.allIds?.includes(edId);
      });

      if (isDeveloper) developed.push(game);
      if (isEditor) published.push(game);
    });

    const sortFn = (a, b) => (b.release_date?.seconds || 0) - (a.release_date?.seconds || 0);

    return {
      developedGames: developed.sort(sortFn),
      publishedGames: published.sort(sortFn)
    };
  }, [entity, games]);

  // Set initial active tab based on availability
  useEffect(() => {
    if (developedGames.length > 0) {
      setActiveTab("produced");
    } else if (publishedGames.length > 0) {
      setActiveTab("published");
    }
  }, [developedGames.length, publishedGames.length]);

  // Fetch covers for all entity games
  useEffect(() => {
    let isMounted = true;
    const fetchCovers = async () => {
      const allEntityGames = [...developedGames, ...publishedGames];
      if (allEntityGames.length === 0) return;

      const gameIds = [...new Set(allEntityGames.map(g => g.igdb_id).filter(Boolean))];
      if (gameIds.length === 0) return;

      await getGameCovers(gameIds, (batch) => {
        if (isMounted) {
          setCoverMap(prev => ({ ...prev, ...batch }));
        }
      });
    };

    fetchCovers();
    return () => { isMounted = false; };
  }, [developedGames, publishedGames, setCoverMap]);

  const parentCompany = useMemo(() => {
    if (!entity?.parentCompanyId) return null;
    return companies.find(c => c.id === entity.parentCompanyId || c.slug === entity.parentCompanyId);
  }, [entity, companies]);

  const subsidiaries = useMemo(() => {
    if (!entity) return [];
    return companies.filter(c => c.parentCompanyId === entity.id || c.parentCompanyId === entity.slug);
  }, [entity, companies]);

  if (loadingCompanies || loadingGames) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      </Layout>
    );
  }

  if (!entity) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
          <h1 className="text-4xl font-black opacity-20 italic">Company not found</h1>
          <button
            onClick={() => navigate("/companies")}
            className="flex items-center gap-2 bg-white/10 px-6 py-3 rounded-2xl font-bold hover:bg-white/20 transition-colors"
          >
            <FaArrowLeft /> Back to Companies
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-6 pb-12 md:py-20 space-y-12">
        <header className="relative">
          <button
            onClick={() => navigate(-1)}
            className="absolute -top-12 md:-top-16 left-0 flex items-center gap-2 text-white/40 hover:text-white font-bold transition-colors group"
          >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back
          </button>

          <div className="flex flex-col md:flex-row md:items-end gap-8 pt-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="size-32 md:size-48 bg-white/5 border border-white/10 rounded-[2.5rem] p-6 backdrop-blur-md flex items-center justify-center shadow-2xl relative group overflow-hidden shrink-0"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              {entity.logo ? (
                <img src={entity.logo} alt={entity.name} className="w-full h-full object-contain relative z-10" />
              ) : (
                <FaBuilding className="text-white/10 text-6xl relative z-10 rotate-12" />
              )}
            </motion.div>

            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl md:text-6xl font-black text-white tracking-tight"
                >
                  {he.decode(entity.name)}
                </motion.h1>
                {userData?.isAdmin && (
                  <Link
                    to={`/admin/companies`}
                    state={{ search: entity.name }}
                    className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-amber-500/20 hover:border-amber-500/40 text-amber-500 transition-all shadow-xl group/edit"
                    title="Edit Company"
                  >
                    <AiFillEdit className="size-5 md:size-6 group-hover/edit:scale-110 transition-transform" />
                  </Link>
                )}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap gap-3 md:gap-4"
              >
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl text-white/60 font-bold text-sm">
                  <FaGlobe className="text-white/40" />
                  {entity.country}
                </div>
                {entity.city && (
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl text-white/60 font-bold text-sm">
                    <FaCity className="text-white/40" />
                    {entity.city}
                  </div>
                )}
                {entity.website && (
                  <a
                    href={entity.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 bg-gradient-primary border border-white/20 px-4 py-2 rounded-2xl text-white font-bold hover:scale-105 active:scale-95 transition-all text-sm"
                  >
                    <FaExternalLinkAlt size={12} />
                    Official Website
                  </a>
                )}
              </motion.div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-10">
            {parentCompany && (
              <section>
                <h2 className="text-xs font-black uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
                  <span className="w-8 h-px bg-white/20" />
                  Parent Company
                </h2>
                <Link
                  to={`/companies/${parentCompany.slug || parentCompany.id}`}
                  className="block bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-primary/40 hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-16 bg-white/10 rounded-2xl p-3 flex items-center justify-center overflow-hidden shrink-0">
                      {parentCompany.logo ? (
                        <img src={parentCompany.logo} alt={parentCompany.name} className="w-full h-full object-contain" />
                      ) : (
                        <FaBuilding className="text-white/20" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-lg truncate group-hover:text-white transition-colors">{he.decode(parentCompany.name)}</p>
                      <p className="text-[10px] font-black uppercase tracking-tighter text-white/20">View Profile</p>
                    </div>
                  </div>
                </Link>
              </section>
            )}

            {subsidiaries.length > 0 && (
              <section>
                <h2 className="text-xs font-black uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
                  <span className="w-8 h-px bg-white/20" />
                  Internal Entities ({subsidiaries.length})
                </h2>
                <div className="space-y-3">
                  {subsidiaries.map(sub => (
                    <Link
                      key={sub.id}
                      to={`/companies/${sub.slug || sub.id}`}
                      className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-5 py-4 hover:bg-white/10 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-8 bg-white/5 rounded-lg flex items-center justify-center p-1 overflow-hidden shrink-0">
                          {sub.logo ? <img src={sub.logo} alt={sub.name} /> : <FaBuilding className="text-white/10" />}
                        </div>
                        <span className="font-bold text-sm group-hover:text-white transition-colors">{he.decode(sub.name)}</span>
                      </div>
                      <FaArrowLeft className="rotate-180 text-white/0 group-hover:text-white/20 transition-all" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {entity.studios && entity.studios.length > 0 && (
              <section>
                <h2 className="text-xs font-black uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
                  <span className="w-8 h-px bg-white/20" />
                  Office Locations
                </h2>
                <div className="flex flex-wrap gap-2">
                  {entity.studios.map((loc, i) => (
                    <span key={i} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white/60">
                      {loc}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Main Content: Games */}
          <div className="lg:col-span-3">
            <div className="mb-10 space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <h2 className="text-3xl font-black italic flex items-center gap-4">
                  <FaGamepad className="text-white/20" />
                  Catalog
                </h2>

                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 w-fit">
                  {developedGames.length > 0 && (
                    <button
                      onClick={() => setActiveTab("produced")}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === "produced"
                        ? "bg-gradient-primary text-white shadow-lg shadow-primary/20"
                        : "text-white/40 hover:text-white/60"
                        }`}
                    >
                      <FaHammer size={14} className={activeTab === "produced" ? "animate-pulse" : ""} />
                      Produced
                      <span className="text-[10px] opacity-50 ml-1">({developedGames.length})</span>
                    </button>
                  )}
                  {publishedGames.length > 0 && (
                    <button
                      onClick={() => setActiveTab("published")}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === "published"
                        ? "bg-gradient-primary text-white shadow-lg shadow-primary/20"
                        : "text-white/40 hover:text-white/60"
                        }`}
                    >
                      <FaBullhorn size={14} className={activeTab === "published" ? "animate-pulse" : ""} />
                      Published
                      <span className="text-[10px] opacity-50 ml-1">({publishedGames.length})</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Content for the active tab */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                {((activeTab === "produced" ? developedGames : publishedGames).length > 0) ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
                    {(activeTab === "produced" ? developedGames : publishedGames).map((game, index) => (
                      <motion.div
                        key={game.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: Math.min(index * 0.05, 0.5) }}
                      >
                        <CompactGameCard
                          game={game}
                          coverImage={coverMap ? coverMap[game.igdb_id] : null}
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-[3rem] border border-dashed border-white/10 p-20 text-center">
                    <FaGamepad className="mx-auto text-6xl text-white/10 mb-6" />
                    <p className="text-xl font-bold text-white/20 italic">No games listed in the {activeTab} catalog.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CompanyDetails;

