import { useState } from "react";
import Layout from "../../components/shared/Layout";
import { FaDatabase, FaExchangeAlt, FaCheckCircle, FaExclamationTriangle, FaHourglassHalf, FaPlay, FaTerminal } from "react-icons/fa";
import { migrateCompanies } from "../../js/migrate-companies";
import { motion, AnimatePresence } from "framer-motion";

export const adminConfig = {
  title: "Company Unification",
  description: "Migrates developers and editors into a single unified companies collection.",
  icon: FaExchangeAlt,
  color: "from-blue-500/20 to-indigo-500/20",
  borderColor: "border-blue-500/30",
  accentColor: "text-blue-400",
  active: false
};

const CompanyMigration = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [migrationResults, setMigrationResults] = useState(null);
  const [isMigrating, setIsMigrating] = useState(false);

  const runDryRun = async () => {
    setIsMigrating(true);
    try {
      const results = await migrateCompanies({ dryRun: true });
      setMigrationResults(results);
      setCurrentStep(2);
    } catch (error) {
      console.error("Dry run failed:", error);
    } finally {
      setIsMigrating(false);
    }
  };

  const runLiveMigration = async () => {
    setIsMigrating(true);
    setCurrentStep(3);
    try {
      const results = await migrateCompanies({ dryRun: false });
      setMigrationResults(results);
      setCurrentStep(4);
    } catch (error) {
      console.error("Live migration failed:", error);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-6 py-10 md:py-20">
        <header className="mb-12">
          <h1 className="text-4xl font-black bg-gradient-brand text-transparent bg-clip-text">Company Migration Tool</h1>
          <p className="text-white/40 font-bold uppercase tracking-widest text-sm mt-2">
            Unify developers and editors collections into a canonical Companies collection
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
                <div className="size-24 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-blue-500/20">
                  <FaDatabase className="text-4xl text-blue-400" />
                </div>
                <h2 className="text-3xl font-black mb-4">Ready to Scout?</h2>
                <p className="text-white/50 text-lg mb-10 max-w-lg mx-auto">
                  This will simulate the migration and show you exactly what will happen to your database. No actual changes will be made during the dry run.
                </p>
                <button
                  disabled={isMigrating}
                  onClick={runDryRun}
                  className="bg-gradient-primary px-10 py-4 rounded-2xl font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/20 flex items-center gap-3 mx-auto disabled:opacity-50"
                >
                  {isMigrating ? <FaHourglassHalf className="animate-spin" /> : <FaPlay className="text-sm" />}
                  Run Dry Run
                </button>
              </motion.div>
            )}

            {currentStep === 2 && migrationResults && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-black">Dry Run Results</h2>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="bg-white/10 hover:bg-white/20 px-8 py-3 rounded-xl font-bold transition-all"
                      >
                        Restart
                      </button>
                      <button
                        onClick={() => setCurrentStep(3)}
                        className="bg-gradient-secondary px-8 py-3 rounded-xl font-black shadow-lg shadow-secondary/20 hover:scale-105 transition-transform"
                      >
                        Proceed to Live
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5 text-center">
                      <div className="text-4xl font-black text-white mb-2">{Object.keys(migrationResults.companies).length}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/40">New Profiles</div>
                    </div>
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5 text-center">
                      <div className="text-4xl font-black text-white mb-2">{migrationResults.gamesToUpdate.length}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/40">Games to Update</div>
                    </div>
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5 text-center">
                      <div className="text-4xl font-black text-red-400 mb-2">{migrationResults.errors.length}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/40">Errors</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-black flex items-center gap-3">
                      <FaTerminal className="text-white/20" />
                      Migration Logs
                    </h3>
                    <div className="bg-black/40 rounded-2xl p-6 font-mono text-sm max-h-[400px] overflow-y-auto custom-scrollbar border border-white/5">
                      {migrationResults.logs.map((log, i) => (
                        <div key={i} className="mb-1 text-white/60">
                          <span className="text-white/20 mr-4">[{i + 1}]</span>
                          {log}
                        </div>
                      ))}
                    </div>
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
                className="bg-white/5 border border-white/10 rounded-[2.5rem] p-12 text-center backdrop-blur-xl"
              >
                <div className="size-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-amber-500/20 shadow-inner">
                  <FaExclamationTriangle className="text-3xl text-amber-500" />
                </div>
                <h2 className="text-3xl font-black mb-4">Final Confirmation</h2>
                <p className="text-white/50 text-lg mb-8 max-w-xl mx-auto">
                  You are about to modify <span className="text-white font-black">{migrationResults.gamesToUpdate.length} games</span> and create <span className="text-white font-black">{Object.keys(migrationResults.companies).length} canonical company profiles</span>. This cannot be undone automatically.
                </p>

                <div className="flex flex-col md:flex-row gap-4 justify-center">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="bg-white/5 hover:bg-white/10 px-10 py-4 rounded-2xl font-black text-lg transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={runLiveMigration}
                    disabled={isMigrating}
                    className="bg-gradient-secondary px-10 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-transform shadow-2xl flex items-center gap-3 disabled:opacity-50"
                  >
                    {isMigrating ? <FaHourglassHalf className="animate-spin" /> : <FaPlay className="text-sm" />}
                    Start Live Rotation
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
                <div className="size-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-green-500/20">
                  <FaCheckCircle className="text-5xl text-green-400" />
                </div>
                <h2 className="text-4xl font-black mb-4">Mission Accomplished</h2>
                <p className="text-white/50 text-xl mb-10 max-w-md mx-auto">
                  The migration finished successfully. All developers and editors are now unified under canonical company profiles.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-gradient-primary px-10 py-4 rounded-2xl font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-2xl"
                >
                  Refresh Application
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
};

export default CompanyMigration;
