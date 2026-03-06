import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithRedirect, 
  signOut, 
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  getDocs,
  addDoc,
  updateDoc,
  getDoc,
  arrayUnion,
  arrayRemove,
  query,
  orderBy,
  Timestamp
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBvum7HbWNOfhtG0rd2YzwJVSsNHwHQifE",
  authDomain: "base-de-datos-que-plan.firebaseapp.com",
  projectId: "base-de-datos-que-plan",
  storageBucket: "base-de-datos-que-plan.firebasestorage.app",
  messagingSenderId: "567049586303",
  appId: "1:567049586303:web:d4576d1718d3703152e14a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Force authDomain to ensure it uses the firebaseapp domain
// This is critical for the redirect flow to work without adding the custom domain to Firebase Console
(auth as any).config.authDomain = "base-de-datos-que-plan.firebaseapp.com";

export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export interface UserPlan {
  id: string;
  name: string;
  eventIds: string[];
  createdAt: any;
}

export const signInWithGoogle = async () => {
  try {
    console.log("Attempting to set persistence and sign in...");
    await setPersistence(auth, browserLocalPersistence);
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.error("Error signing in with Google (handled gracefully):", error);
    // We don't throw here to prioritize the email flow as requested
  }
};

export const loginWithEmail = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const registerWithEmail = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

// --- User Profile Management ---

export const updateUserProfile = async (userId: string, displayName: string, photoURL: string) => {
  try {
    const user = auth.currentUser;
    if (user) {
      await updateProfile(user, {
        displayName: displayName,
        photoURL: photoURL
      });
    }

    // Also save to Firestore for persistence and easier access if needed
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      displayName,
      photoURL,
      updatedAt: new Date()
    }, { merge: true });

    return { displayName, photoURL };
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const userRef = doc(db, "users", userId);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

// --- Plans Management (New) ---

export const createPlan = async (userId: string, planName: string) => {
  try {
    const plansRef = collection(db, "users_plans", userId, "plans");
    const newPlan = {
      name: planName,
      eventIds: [],
      createdAt: new Date()
    };
    const docRef = await addDoc(plansRef, newPlan);
    return { id: docRef.id, ...newPlan };
  } catch (error) {
    console.error("Error creating plan:", error);
    throw error;
  }
};

export const deletePlan = async (userId: string, planId: string) => {
  try {
    const planRef = doc(db, "users_plans", userId, "plans", planId);
    await deleteDoc(planRef);
  } catch (error) {
    console.error("Error deleting plan:", error);
    throw error;
  }
};

export const getUserPlans = async (userId: string): Promise<UserPlan[]> => {
  try {
    const plansRef = collection(db, "users_plans", userId, "plans");
    const q = query(plansRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserPlan));
  } catch (error) {
    console.error("Error fetching plans:", error);
    return [];
  }
};

export const addEventToPlan = async (userId: string, planId: string, eventId: string) => {
  try {
    const planRef = doc(db, "users_plans", userId, "plans", planId);
    await updateDoc(planRef, {
      eventIds: arrayUnion(eventId)
    });
  } catch (error) {
    console.error("Error adding event to plan:", error);
    throw error;
  }
};

export const removeEventFromPlan = async (userId: string, planId: string, eventId: string) => {
  try {
    const planRef = doc(db, "users_plans", userId, "plans", planId);
    await updateDoc(planRef, {
      eventIds: arrayRemove(eventId)
    });
  } catch (error) {
    console.error("Error removing event from plan:", error);
    throw error;
  }
};

// Legacy Favorites Logic (Optional: keep for backward compatibility or migrate)
export const saveFavorite = async (userId: string, eventId: string) => {
  try {
    const favoriteRef = doc(db, "users_plans", userId, "favorites", eventId);
    await setDoc(favoriteRef, { addedAt: new Date() });
    console.log(`Favorite saved: ${eventId}`);
  } catch (error) {
    console.error("Error saving favorite:", error);
  }
};

export const removeFavorite = async (userId: string, eventId: string) => {
  try {
    const favoriteRef = doc(db, "users_plans", userId, "favorites", eventId);
    await deleteDoc(favoriteRef);
    console.log(`Favorite removed: ${eventId}`);
  } catch (error) {
    console.error("Error removing favorite:", error);
  }
};

export const getFavorites = async (userId: string): Promise<string[]> => {
  try {
    const favoritesRef = collection(db, "users_plans", userId, "favorites");
    const snapshot = await getDocs(favoritesRef);
    return snapshot.docs.map(doc => doc.id);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return [];
  }
};

export const checkRedirectResult = async () => {
  try {
    console.log("Checking redirect result...");
    const result = await getRedirectResult(auth);
    if (result) {
        console.log("Redirect result found:", result.user.email);
    } else {
        console.log("No redirect result found.");
    }
    return result?.user;
  } catch (error) {
    console.error("Error getting redirect result", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};
