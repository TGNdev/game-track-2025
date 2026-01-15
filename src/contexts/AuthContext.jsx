import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../js/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeFirestore = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      try {
        if (unsubscribeFirestore) {
          unsubscribeFirestore();
          unsubscribeFirestore = null;
        }

        setCurrentUser(user);

        if (user) {
          const userDocRef = doc(db, "users", user.uid);

          unsubscribeFirestore = onSnapshot(userDocRef, async (userDoc) => {
            if (userDoc.exists()) {
              const data = userDoc.data();
              setUserData({
                ...data,
                isAdmin: data.email === process.env.REACT_APP_ADMIN_EMAIL || data.isAdmin === true
              });
              setLoading(false);
            } else {
              const initialData = {
                uid: user.uid,
                email: user.email,
                username: user.email.split("@")[0],
                library: [],
                wanted: [],
                createdAt: new Date().toISOString(),
                isAdmin: user.email === process.env.REACT_APP_ADMIN_EMAIL
              };
              await setDoc(userDocRef, initialData);
            }
          }, (error) => {
            console.error("Firestore listener error:", error);
            setLoading(false);
          });
        } else {
          setUserData(null);
          setLoading(false);
        }
      } catch (error) {
        console.error("Auth context error:", error);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  const value = {
    currentUser,
    userData,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
