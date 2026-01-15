import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, addDoc, deleteDoc, updateDoc, doc, getDocs, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.REACT_APP_API_KEY,
    authDomain: process.env.REACT_APP_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_PROJECT_ID,
    storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
    }),
});

export const getGamesFromFirestore = async () => {
    try {
        const gamesRef = collection(db, "games");
        const querySnapshot = await getDocs(gamesRef);
        const gamesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return gamesList;
    } catch (e) {
        console.error("Error fetching games: ", e);
        throw e;
    }
}

export const addGameToFirestore = async (gameData) => {
    try {
        const gamesRef = collection(db, "games");
        const game = await addDoc(gamesRef, gameData);
        console.log("Game added with ID: ", game.id);
    } catch (e) {
        throw e;
    }
};

export const deleteGameFromFirestore = async (gameId) => {
    try {
        const gameRef = doc(db, "games", gameId);
        await deleteDoc(gameRef);
    } catch (e) {
        console.error("Error deleting document: ", e);
    }
};

export const editGameFromFirestore = async (gameId, gameData) => {
    try {
        const gameRef = doc(db, "games", gameId);
        await updateDoc(gameRef, { ...gameData });
    } catch (e) {
        console.error("Error editing document: ", e);
    }
}

export const signIn = async (email, password) => {
    try {
        return await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
        console.error("Error logging in: ", e);
        throw e;
    }
};

export const register = async (email, password) => {
    try {
        return await createUserWithEmailAndPassword(auth, email, password);
    } catch (e) {
        console.error("Error registering: ", e);
        throw e;
    }
};

export const getTgaFromFirestore = async () => {
    try {
        const tgaRef = collection(db, "tga");
        const querySnapshot = await getDocs(tgaRef);
        const tgaList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return tgaList;
    } catch (e) {
        console.error("Error fetching TGA data: ", e);
        throw e;
    }
};

export const addToLibrary = async (userId, gameId) => {
    try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            library: arrayUnion(gameId)
        });
    } catch (e) {
        console.error("Error adding to library: ", e);
        throw e;
    }
};

export const removeFromLibrary = async (userId, gameId) => {
    try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            library: arrayRemove(gameId)
        });
    } catch (e) {
        console.error("Error removing from library: ", e);
        throw e;
    }
};

export const addCountdown = async (userId, gameId) => {
    try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            wanted: arrayUnion(gameId)
        });
    } catch (e) {
        console.error("Error adding to wishlist: ", e);
        throw e;
    }
};

export const removeCountdown = async (userId, gameId) => {
    try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            wanted: arrayRemove(gameId)
        });
    } catch (e) {
        console.error("Error removing from wishlist: ", e);
        throw e;
    }
};

export const getUserProfile = async (userId) => {
    try {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            return userDoc.data();
        }
        return null;
    } catch (e) {
        console.error("Error fetching user profile: ", e);
        throw e;
    }
};

export { db, auth };