import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  orderBy, 
  limit,
  deleteDoc,
  doc
} from "firebase/firestore";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";
import { HighScore } from "../types";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Reference to high scores collection
const highScoresCol = collection(db, "highScores");

// Get high scores sorted by score descending, limit 25 (get more for admin screen)
export async function fetchHighScoresFromFirebase(maxLimit = 10): Promise<HighScore[]> {
  try {
    const q = query(highScoresCol, orderBy("score", "desc"), limit(maxLimit));
    const querySnapshot = await getDocs(q);
    const scores: HighScore[] = [];
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      scores.push({
        id: docSnapshot.id,
        name: data.name || "UNNAMED",
        score: Number(data.score) || 0,
        accuracy: Number(data.accuracy) || 100,
        date: data.date || new Date().toLocaleDateString(),
      });
    });
    return scores;
  } catch (error) {
    console.error("Failed to fetch high scores from Firebase:", error);
    // Return empty array on error so caller can fallback to localStorage
    return [];
  }
}

// Save a high score
export async function saveHighScoreToFirebase(highScore: HighScore): Promise<boolean> {
  try {
    await addDoc(highScoresCol, {
      name: highScore.name,
      score: highScore.score,
      accuracy: highScore.accuracy,
      date: highScore.date,
      timestamp: new Date() // additional timestamp field for database sorting if needed
    });
    return true;
  } catch (error) {
    console.error("Failed to save high score to Firebase:", error);
    return false;
  }
}

// Delete a high score (Only verified admin email via Firestore rules can perform this)
export async function deleteHighScoreFromFirebase(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, "highScores", id));
    return true;
  } catch (error) {
    console.error("Failed to delete high score from Firebase:", error);
    return false;
  }
}

// Sign in with Google Popup
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google sign in failed:", error);
    return null;
  }
}

// Sign Out
export async function logOutAdmin(): Promise<void> {
  await signOut(auth);
}
