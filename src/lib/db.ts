import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  Firestore
} from "firebase/firestore";

export interface Complaint {
  complaintId: string;
  transcript: string;
  category: string;
  wardDetails: string;
  severity: string;
  stage: "filed" | "internal_alert" | "rti_triggered" | "escalated" | "resolved";
  createdAt: string; // ISO String
  slaDeadline: string; // ISO String
  daysElapsed: number;
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const hasFirebaseConfig = !!(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
);

let db: Firestore | null = null;

if (hasFirebaseConfig) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    console.log("Firebase Firestore initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Firebase Firestore, using mock database:", error);
  }
} else {
  console.log("No Firebase environment variables found. Using in-memory mock database.");
}

// In-memory fallback setup
const DEFAULT_COMPLAINT: Complaint = {
  complaintId: "GCC-2026-89412",
  transcript: "Open sewage overflow near the bus stop, Ward 172, Velachery. It's been like this for three weeks and nobody's come to look at it.",
  category: "Sanitation & Drainage",
  wardDetails: "Ward 172 · Velachery, Chennai",
  severity: "High",
  stage: "filed",
  createdAt: new Date().toISOString(),
  slaDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  daysElapsed: 0,
};

const globalForDb = globalThis as unknown as {
  mockComplaints: Record<string, Complaint>;
};

if (!globalForDb.mockComplaints) {
  globalForDb.mockComplaints = {
    [DEFAULT_COMPLAINT.complaintId]: { ...DEFAULT_COMPLAINT }
  };
}

export async function getComplaints(): Promise<Complaint[]> {
  if (db) {
    try {
      const q = query(collection(db, "complaints"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const complaints: Complaint[] = [];
      snapshot.forEach((docSnap) => {
        complaints.push(docSnap.data() as Complaint);
      });
      // If Firestore is empty, seed it with the default complaint
      if (complaints.length === 0) {
        await saveComplaint(DEFAULT_COMPLAINT);
        complaints.push(DEFAULT_COMPLAINT);
      }
      return complaints;
    } catch (e) {
      console.error("Error fetching complaints from Firestore:", e);
    }
  }
  
  // Mock DB implementation
  return Object.values(globalForDb.mockComplaints).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getComplaintById(id: string): Promise<Complaint | null> {
  if (db) {
    try {
      const docRef = doc(db, "complaints", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as Complaint;
      }
      return null;
    } catch (e) {
      console.error("Error fetching complaint from Firestore:", e);
    }
  }
  
  // Mock DB implementation
  return globalForDb.mockComplaints[id] || null;
}

export async function saveComplaint(complaint: Complaint): Promise<void> {
  if (db) {
    try {
      const docRef = doc(db, "complaints", complaint.complaintId);
      await setDoc(docRef, complaint);
      return;
    } catch (e) {
      console.error("Error saving complaint to Firestore:", e);
    }
  }
  
  // Mock DB implementation
  globalForDb.mockComplaints[complaint.complaintId] = { ...complaint };
}

export async function updateComplaint(id: string, updates: Partial<Complaint>): Promise<void> {
  if (db) {
    try {
      const docRef = doc(db, "complaints", id);
      await updateDoc(docRef, updates);
      return;
    } catch (e) {
      console.error("Error updating complaint in Firestore:", e);
    }
  }
  
  // Mock DB implementation
  if (globalForDb.mockComplaints[id]) {
    globalForDb.mockComplaints[id] = {
      ...globalForDb.mockComplaints[id],
      ...updates
    };
  }
}

export async function resetComplaintToFiled(id: string): Promise<void> {
  const now = new Date();
  const sla = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  await updateComplaint(id, {
    stage: "filed",
    createdAt: now.toISOString(),
    slaDeadline: sla.toISOString(),
    daysElapsed: 0
  });
}

export async function clearAllComplaints(): Promise<void> {
  if (db) {
    try {
      const q = query(collection(db, "complaints"));
      const snapshot = await getDocs(q);
      const batchPromises = snapshot.docs.map((docSnap) => deleteDoc(doc(db, "complaints", docSnap.id)));
      await Promise.all(batchPromises);
    } catch (e) {
      console.error("Error clearing complaints from Firestore:", e);
    }
  }
  
  // Mock DB implementation
  globalForDb.mockComplaints = {
    [DEFAULT_COMPLAINT.complaintId]: { ...DEFAULT_COMPLAINT, createdAt: new Date().toISOString() }
  };
}
