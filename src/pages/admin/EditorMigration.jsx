import { useState, useEffect } from "react";
import Layout from "../../components/shared/Layout";
import { FaDatabase, FaExchangeAlt, FaCheckCircle, FaExclamationTriangle, FaHourglassHalf, FaPlay } from "react-icons/fa";
import { useGameData } from "../../contexts/GameDataContext";
import { saveEditor, editGameFromFirestore } from "../../js/firebase";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";

export const adminConfig = {
    title: "Editor Migration (Legacy)",
    description: "DEPRECATED: Prefer the full Company Migration tool. Migrate legacy editor strings to the editors collection.",
    icon: FaExchangeAlt,
    color: "from-purple-500/10 to-pink-500/10",
    borderColor: "border-purple-500/20",
    accentColor: "text-purple-400/50"
};

const EditorMigration = () => {
    const { games, editors, ensureEditorsLoaded, refreshEditorsData } = useGameData();
    const [currentStep, setCurrentStep] = useState(1);
    const [scannedData, setScannedData] = useState(null);
    const [isMigrating, setIsMigrating] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    useEffect(() => {
        ensureEditorsLoaded();
    }, [ensureEditorsLoaded]);

    const scanGames = () => {
        const legacyMap = new Map(); // Name -> { games: [], exists: false, existingId: null }

        games.forEach(game => {
            const hasLegacy = game.editors && game.editors.length > 0;
            const hasRefs = game.editorRefs && game.editorRefs.length > 0;

            // If it has legacy but no refs, or fewer refs than legacy
            if (hasLegacy && (!hasRefs || game.editorRefs.length < game.editors.length)) {
                game.editors.forEach(ed => {
                    const name = ed.name.trim();
                    if (!name) return;

                    if (!legacyMap.has(name)) {
                        legacyMap.set(name, {
                            name,
                            games: [],
                            exists: editors.some(e => e.name.toLowerCase() === name.toLowerCase()),
                            existingId: editors.find(e => e.name.toLowerCase() === name.toLowerCase())?.id || null
                        });
                    }
                    legacyMap.get(name).games.push(game.id);
                });
            }
        });

        setScannedData(Array.from(legacyMap.values()));
        setCurrentStep(2);
    };

    const startMigration = async () => {
        setIsMigrating(true);
        setCurrentStep(4);
        const total = scannedData.length;
        setProgress({ current: 0, total });

        try {
            // 1. First, create missing editors
            const nameToId = new Map();

            // Populate existing editors
            editors.forEach(e => {
                nameToId.set(e.name.toLowerCase(), e.id);
            });

            for (let i = 0; i < scannedData.length; i++) {
                const item = scannedData[i];
                let editorId = item.existingId;

                if (!item.exists && !editorId) {
                    // Create new editor
                    editorId = await saveEditor({
                        name: item.name,
                        createdAt: new Date().toISOString()
                    });
                    console.log(`Created editor: ${item.name} with ID: ${editorId}`);
                }

                nameToId.set(item.name.toLowerCase(), editorId);
                setProgress(prev => ({ ...prev, current: i + 1 }));
            }

            // 2. Now update games
            const gamesToUpdate = new Set();
            scannedData.forEach(item => {
                item.games.forEach(gId => gamesToUpdate.add(gId));
            });

            const gamesArray = Array.from(gamesToUpdate);
            setProgress({ current: 0, total: gamesArray.length });

            for (let i = 0; i < gamesArray.length; i++) {
                const gameId = gamesArray[i];
                const game = games.find(g => g.id === gameId);
                if (!game) continue;

                const newRefs = [...(game.editorRefs || [])];

                game.editors.forEach(ed => {
                    const editorId = nameToId.get(ed.name.trim().toLowerCase());
                    if (editorId && !newRefs.some(ref => (typeof ref === 'string' ? ref : ref.devId) === editorId)) {
                        newRefs.push({ devId: editorId });
                    }
                });

                // Update Firestore
                await editGameFromFirestore(gameId, { editorRefs: newRefs });

                // Update local state is handled below by refresh
                setProgress(prev => ({ ...prev, current: i + 1 }));
            }

            toast.success("Migration completed successfully!");
            refreshEditorsData();
            // We should probably refresh games too or wait for refresh
            setTimeout(() => window.location.reload(), 2000); // Simple way to ensure everything is fresh
        } catch (error) {
            console.error("Migration failed:", error);
            toast.error("Migration failed. Check console.");
        } finally {
            setIsMigrating(false);
        }
    };

    return (
        <Layout>
            <div className="mx-auto max-w-5xl px-6 py-10 md:py-20">
                <header className="mb-12">
                    <h1 className="text-4xl font-black bg-gradient-brand text-transparent bg-clip-text">Editor Migration Tool</h1>
                    <p className="text-white/40 font-bold uppercase tracking-widest text-sm mt-2">
                        Scan and link legacy publishers to the new centralized collection
                    </p>
                </header>

                <div className="relative">
                    {/* Stepper */}
                    <div className="flex justify-between mb-12 relative px-4">
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2 z-0" />
                        {[1, 2, 3, 4].map(step => (
                            <div
                                key={step}
                                className={`size-10 rounded-full flex items-center justify-center font-black z-10 transition-all shadow-xl ${currentStep >= step ? "bg-gradient-primary text-white scale-110" : "bg-white/10 text-white/20"
                                    }`}
                            >
                                {currentStep > step ? <FaCheckCircle /> : step}
                            </div>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {currentStep === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-white/5 border border-white/10 rounded-[2.5rem] p-12 text-center backdrop-blur-xl"
                            >
                                <div className="size-24 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-purple-500/20">
                                    <FaDatabase className="text-4xl text-purple-400" />
                                </div>
                                <h2 className="text-3xl font-black mb-4">Start System Scan</h2>
                                <p className="text-white/50 text-lg mb-10 max-w-lg mx-auto">
                                    I will analyze all games in the library to find those still using the old "hardcoded" editor strings instead of IDs.
                                </p>
                                <button
                                    onClick={scanGames}
                                    className="bg-gradient-primary px-10 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-transform shadow-2xl shadow-primary/20 flex items-center gap-3 mx-auto"
                                >
                                    <FaPlay className="text-sm" /> Run Scanner
                                </button>
                            </motion.div>
                        )}

                        {currentStep === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl">
                                    <div className="flex items-center justify-between mb-8">
                                        <h2 className="text-2xl font-black flex items-center gap-4">
                                            <span className="bg-white/10 px-4 py-1 rounded-full text-sm text-white/40">{scannedData.length}</span>
                                            Unique Editors Found
                                        </h2>
                                        <button
                                            onClick={() => setCurrentStep(3)}
                                            className="bg-white/10 hover:bg-white/20 px-8 py-3 rounded-xl font-bold transition-all"
                                        >
                                            Next Step
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                                        {scannedData.map((item, idx) => (
                                            <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:border-white/20 transition-all">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-lg">{item.name}</span>
                                                    <span className="text-[10px] font-black uppercase text-white/30 tracking-widest">{item.games.length} Games linked</span>
                                                </div>
                                                {item.exists ? (
                                                    <span className="bg-green-500/10 text-green-400 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-tighter border border-green-500/20">Exists</span>
                                                ) : (
                                                    <span className="bg-amber-500/10 text-amber-400 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-tighter border border-amber-500/20">New</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-white/5 border border-white/10 rounded-[2.5rem] p-12 backdrop-blur-xl"
                            >
                                <div className="size-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-amber-500/20 shadow-inner">
                                    <FaExclamationTriangle className="text-3xl text-amber-500" />
                                </div>
                                <h2 className="text-3xl font-black mb-4">Final Review</h2>
                                <p className="text-white/50 text-lg mb-8 max-w-xl mx-auto">
                                    The migration will create <span className="text-white font-black">{scannedData.filter(i => !i.exists).length} new editors</span> and link them to <span className="text-white font-black">{new Set(scannedData.flatMap(i => i.games)).size} games</span>.
                                    Legacy strings will be preserved.
                                </p>

                                <div className="flex flex-col md:flex-row gap-4 justify-center">
                                    <button
                                        onClick={() => setCurrentStep(2)}
                                        className="bg-white/5 hover:bg-white/10 px-10 py-4 rounded-2xl font-black text-lg transition-all"
                                    >
                                        Back to list
                                    </button>
                                    <button
                                        onClick={startMigration}
                                        className="bg-gradient-secondary px-10 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-transform shadow-2xl flex items-center gap-3"
                                    >
                                        Execute Migration
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white/5 border border-white/10 rounded-[2.5rem] p-12 text-center backdrop-blur-xl"
                            >
                                <div className="size-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                                    <div className="absolute inset-0 border-4 border-white/10 rounded-full" />
                                    <div
                                        className="absolute inset-0 border-4 border-primary rounded-full transition-all duration-300"
                                        style={{ clipPath: `inset(0 0 0 0)`, transform: `rotate(${(progress.current / progress.total) * 360}deg)` }}
                                    />
                                    <FaHourglassHalf className="text-3xl text-white/20 animate-pulse" />
                                </div>
                                <h2 className="text-3xl font-black mb-4">{isMigrating ? "Processing..." : "Migration Complete"}</h2>
                                <div className="max-w-md mx-auto h-4 bg-white/10 rounded-full overflow-hidden mb-4">
                                    <motion.div
                                        className="h-full bg-gradient-primary"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                                    />
                                </div>
                                <p className="text-white/40 font-black uppercase tracking-widest text-sm">
                                    {progress.current} / {progress.total} items processed
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </Layout>
    );
};

export default EditorMigration;
