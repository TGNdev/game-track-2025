import { db, getGamesFromFirestore, getDevelopersFromFirestore, getEditorsFromFirestore } from "./firebase";
import { writeBatch, doc } from "firebase/firestore";
import { slugify } from "./utils";

export const migrateCompanies = async (options = { dryRun: true }) => {
  const results = {
    logs: [],
    companies: {},
    gamesToUpdate: [],
    errors: []
  };

  const log = (msg) => {
    console.log(msg);
    results.logs.push(msg);
  };

  try {
    log(`--- Starting Migration (${options.dryRun ? "DRY RUN" : "LIVE"}) ---`);

    // 1. Fetch data
    log("Fetching current data...");
    const [developers, editors, games] = await Promise.all([
      getDevelopersFromFirestore(),
      getEditorsFromFirestore(),
      getGamesFromFirestore()
    ]);

    log(`Found ${developers.length} developers, ${editors.length} editors, and ${games.length} games.`);

    // 2. Process Companies
    const companyMap = new Map(); // name -> companyData

    // Helper to get or create company
    const getCompany = (name) => {
      const normalizedName = name.trim();
      if (!companyMap.has(normalizedName)) {
        companyMap.set(normalizedName, {
          name: normalizedName,
          slug: slugify(normalizedName),
          roles: [],
          logo: null,
          website: null,
          city: null,
          country: null,
          studios: [],
          parentCompanyId: null,
          oldIds: [] // Track old IDs for reference mapping
        });
      }
      return companyMap.get(normalizedName);
    };

    // Process Developers first (as primary source of info)
    developers.forEach(dev => {
      const company = getCompany(dev.name);
      if (!company.roles.includes("developer")) {
        company.roles.push("developer");
      }
      company.oldIds.push({ type: "developer", id: dev.id });

      // Update info if not set
      company.logo = dev.logo || company.logo || null;
      company.website = dev.website || company.website || null;
      company.city = dev.city || company.city || null;
      company.country = dev.country || company.country || null;
      company.studios = dev.studios || company.studios || [];
      company.parentCompanyId = dev.parentCompanyId || company.parentCompanyId || null;
    });

    // Process Editors
    editors.forEach(editor => {
      const company = getCompany(editor.name);
      if (!company.roles.includes("editor")) {
        company.roles.push("editor");
      }
      company.oldIds.push({ type: "editor", id: editor.id });

      // Merge info if missing
      company.logo = company.logo || editor.logo || null;
      company.website = company.website || editor.website || null;
      company.city = company.city || editor.city || null;
      company.country = company.country || editor.country || null;
      company.studios = (company.studios && company.studios.length) ? company.studios : (editor.studios || []);
      company.parentCompanyId = company.parentCompanyId || editor.parentCompanyId || null;
    });

    log(`Unified into ${companyMap.size} unique companies.`);

    // 3. Build lookup map: oldId -> newSlug
    const idToSlugMap = new Map();
    companyMap.forEach(company => {
      company.oldIds.forEach(ref => {
        idToSlugMap.set(ref.id, company.slug);
      });
    });

    // 4. Update Games
    games.forEach(game => {
      let updated = false;
      const newDevRefs = (game.developerRefs || []).map(ref => {
        const devId = typeof ref === 'object' ? ref.devId : ref;
        const newSlug = idToSlugMap.get(devId);
        if (newSlug) {
          updated = true;
          return typeof ref === 'object' ? { ...ref, devId: newSlug } : newSlug;
        }
        return ref;
      });

      const newEditorRefs = (game.editorRefs || []).map(ref => {
        const edId = typeof ref === 'object' ? ref.devId : ref;
        const newSlug = idToSlugMap.get(edId);
        if (newSlug) {
          updated = true;
          return typeof ref === 'object' ? { ...ref, devId: newSlug } : newSlug;
        }
        return ref;
      });

      if (updated) {
        results.gamesToUpdate.push({
          id: game.id,
          name: game.name,
          developerRefs: newDevRefs,
          editorRefs: newEditorRefs
        });
      }
    });

    log(`Planned to update ${results.gamesToUpdate.length} games.`);

    // 5. Build Final Companies Object for results
    companyMap.forEach((data, name) => {
      results.companies[data.slug] = {
        name: data.name || "Unknown",
        slug: data.slug,
        roles: data.roles || [],
        logo: data.logo || null,
        website: data.website || null,
        city: data.city || null,
        country: data.country || null,
        studios: data.studios || [],
        parentCompanyId: data.parentCompanyId || null
      };
    });

    // 6. Execute Batch Writes if not dry run
    if (!options.dryRun) {
      log("Executing batch writes...");
      const batch = writeBatch(db);

      // Create companies
      Object.keys(results.companies).forEach(slug => {
        const companyRef = doc(db, "companies", slug);
        batch.set(companyRef, results.companies[slug]);
      });

      // Update games
      results.gamesToUpdate.forEach(game => {
        const gameRef = doc(db, "games", game.id);
        batch.update(gameRef, {
          developerRefs: game.developerRefs,
          editorRefs: game.editorRefs
        });
      });

      await batch.commit();
      log("Migration committed successfully!");
    } else {
      log("Dry run complete. No changes made to Firestore.");
    }

  } catch (err) {
    log(`ERROR: ${err.message}`);
    results.errors.push(err.message);
  }

  return results;
};
