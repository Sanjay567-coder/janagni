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
import { adminDb } from "./firebaseAdmin";
import fs from "fs";
import path from "path";

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
  attachedMediaUrl?: string;
  attachedMediaType?: "image" | "video";
  officerNote?: string;
  officerProofUrl?: string;
  isDeclined?: boolean;
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

// Seed data array
const MOCK_COMPLAINTS: Complaint[] = [
  {
    complaintId: "GCC-2026-89412",
    transcript: "Open sewage overflow near the bus stop, Ward 172, Velachery. It's been like this for three weeks and nobody's come to look at it.",
    category: "Sanitation & Drainage",
    wardDetails: "Ward 172 · Velachery, Chennai",
    severity: "High",
    stage: "filed",
    createdAt: new Date().toISOString(),
    slaDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    daysElapsed: 0,
  },
  {
    complaintId: "GCC-2026-87411",
    transcript: "Huge pothole near the Adyar flyover junction. Several two-wheelers have skidded here during night. Urgent repair needed.",
    category: "Roads & Potholes",
    wardDetails: "Ward 170 · Adyar, Chennai",
    severity: "Medium",
    stage: "internal_alert",
    createdAt: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString(),
    slaDeadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    daysElapsed: 32,
  },
  {
    complaintId: "GCC-2026-85103",
    transcript: "Entire street corner near the beach road has three streetlights completely dead. It gets very dark and unsafe after 7 PM.",
    category: "Streetlights",
    wardDetails: "Ward 175 · Thiruvanmiyur, Chennai",
    severity: "Low",
    stage: "rti_triggered",
    createdAt: new Date(Date.now() - 37 * 24 * 60 * 60 * 1000).toISOString(),
    slaDeadline: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    daysElapsed: 37,
  },
  {
    complaintId: "GCC-2026-81990",
    transcript: "Commercial garbage piling up on the pavement of 2nd cross street, attracting stray dogs and cattle. Blocking public access.",
    category: "Garbage Disposal",
    wardDetails: "Ward 178 · Besant Nagar, Chennai",
    severity: "High",
    stage: "escalated",
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    slaDeadline: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    daysElapsed: 45,
  },
  {
    complaintId: "GCC-2026-79920",
    transcript: "Hanging electrical cables from the transformer near the children's playground. Major hazard during monsoon season.",
    category: "Public Safety",
    wardDetails: "Ward 180 · Kotturpuram, Chennai",
    severity: "Medium",
    stage: "resolved",
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    slaDeadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
    daysElapsed: 12,
  },
  {
    complaintId: "GCC-2026-75122",
    transcript: "Clogged stormwater drains causing severe road inundation even after minor rain. Water entering ground floor residential houses.",
    category: "Sanitation & Drainage",
    wardDetails: "Ward 172 · Velachery, Chennai",
    severity: "High",
    stage: "filed",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    slaDeadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
    daysElapsed: 2,
  },
  {
    complaintId: "GCC-2026-72301",
    transcript: "Broken pavement tiles and exposed iron rebar on the pedestrian walk path near the metro station entrance. Risk to elderly walkers.",
    category: "Roads & Potholes",
    wardDetails: "Ward 171 · Guindy, Chennai",
    severity: "Medium",
    stage: "resolved",
    createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    slaDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    daysElapsed: 28,
  }
];

const MOCK_FILE_PATH = path.join(process.cwd(), "src/lib/mock_db.json");

function readMockDb(): Record<string, Complaint> {
  try {
    if (fs.existsSync(MOCK_FILE_PATH)) {
      const data = fs.readFileSync(MOCK_FILE_PATH, "utf8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error reading mock DB file:", e);
  }
  
  // Seed initial data if file does not exist
  const initial: Record<string, Complaint> = {};
  MOCK_COMPLAINTS.forEach((c) => {
    initial[c.complaintId] = { 
      ...c, 
      createdAt: new Date(Date.now() - c.daysElapsed * 24 * 60 * 60 * 1000).toISOString()
    };
  });
  try {
    fs.writeFileSync(MOCK_FILE_PATH, JSON.stringify(initial, null, 2), "utf8");
  } catch (e) {
    console.error("Error writing initial mock DB:", e);
  }
  return initial;
}

function writeMockDb(data: Record<string, Complaint>) {
  try {
    fs.writeFileSync(MOCK_FILE_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Error writing mock DB file:", e);
  }
}

export async function getComplaints(): Promise<Complaint[]> {
  if (db) {
    try {
      console.log("[DB PATH] getComplaints: Querying live Firestore database via Client SDK.");
      const q = query(collection(db, "complaints"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const complaints: Complaint[] = [];
      snapshot.forEach((docSnap) => {
        complaints.push(docSnap.data() as Complaint);
      });
      return complaints;
    } catch (e) {
      console.error("[DB PATH] getComplaints: Error fetching from Firestore:", e);
    }
  }
  
  console.log("[DB PATH] getComplaints: Querying persistent mock file-based database.");
  const mockDb = readMockDb();
  return Object.values(mockDb).sort(
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
  const mockDb = readMockDb();
  return mockDb[id] || null;
}

export async function saveComplaint(complaint: Complaint): Promise<void> {
  if (adminDb) {
    try {
      console.log("[DB PATH] saveComplaint: Writing to Firestore using Firebase Admin SDK.");
      await adminDb.collection("complaints").doc(complaint.complaintId).set(complaint);
      return;
    } catch (e) {
      console.error("[DB PATH] saveComplaint: Error saving using Admin SDK:", e instanceof Error ? e.message : String(e));
    }
  } else if (db) {
    try {
      console.log("[DB PATH] saveComplaint: Writing to Firestore using Firebase Client SDK.");
      const docRef = doc(db, "complaints", complaint.complaintId);
      await setDoc(docRef, complaint);
      return;
    } catch (e) {
      console.error("[DB PATH] saveComplaint: Error saving using Client SDK:", e);
    }
  }
  
  // Mock DB implementation
  console.log("[DB PATH] saveComplaint: Writing to persistent mock file-based database.");
  const mockDb = readMockDb();
  mockDb[complaint.complaintId] = { ...complaint };
  writeMockDb(mockDb);
}

export async function updateComplaint(id: string, updates: Partial<Complaint>): Promise<void> {
  if (adminDb) {
    try {
      console.log("[DB PATH] updateComplaint: Updating Firestore using Firebase Admin SDK.");
      await adminDb.collection("complaints").doc(id).update(updates);
      return;
    } catch (e) {
      console.error("[DB PATH] updateComplaint: Error updating using Admin SDK:", e instanceof Error ? e.message : String(e));
    }
  } else if (db) {
    try {
      console.log("[DB PATH] updateComplaint: Updating Firestore using Firebase Client SDK.");
      const docRef = doc(db, "complaints", id);
      await updateDoc(docRef, updates);
      return;
    } catch (e) {
      console.error("[DB PATH] updateComplaint: Error updating using Client SDK:", e);
    }
  }
  
  // Mock DB implementation
  const mockDb = readMockDb();
  if (mockDb[id]) {
    console.log("[DB PATH] updateComplaint: Updating persistent mock file-based database.");
    mockDb[id] = {
      ...mockDb[id],
      ...updates
    };
    writeMockDb(mockDb);
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
  if (adminDb) {
    try {
      console.log("[DB PATH] clearAllComplaints: Clearing Firestore using Firebase Admin SDK...");
      const complaintsCol = adminDb.collection("complaints");
      const snapshot = await complaintsCol.get();
      const batch = adminDb.batch();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      snapshot.docs.forEach((docSnap: any) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      console.log("[DB PATH] clearAllComplaints: Successfully cleared Firestore using Firebase Admin SDK.");
    } catch (e) {
      console.error("[DB PATH] clearAllComplaints: Error clearing Firestore using Admin SDK:", e instanceof Error ? e.message : String(e));
    }
  } else if (db) {
    try {
      console.log("[DB PATH] clearAllComplaints: Clearing Firestore using Firebase Client SDK...");
      const q = query(collection(db, "complaints"));
      const snapshot = await getDocs(q);
      const batchPromises = snapshot.docs.map((docSnap) => deleteDoc(doc(db, "complaints", docSnap.id)));
      await Promise.all(batchPromises);
      console.log("[DB PATH] clearAllComplaints: Successfully cleared Firestore using Firebase Client SDK.");
    } catch (e) {
      console.error("[DB PATH] clearAllComplaints: Error clearing Firestore using Client SDK:", e);
    }
  } else {
    console.log("[DB PATH] clearAllComplaints: Clearing persistent mock file-based database.");
  }
  
  // Genuinely clear mock DB file
  writeMockDb({});
}

export async function seedDemoData(): Promise<void> {
  if (db) {
    try {
      console.log("[DB PATH] seedDemoData: Seeding mock complaints to Firestore via Client SDK...");
      for (const mockC of MOCK_COMPLAINTS) {
        await saveComplaint({
          ...mockC,
          createdAt: new Date(Date.now() - mockC.daysElapsed * 24 * 60 * 60 * 1000).toISOString()
        });
      }
      console.log("[DB PATH] seedDemoData: Successfully seeded Firestore database.");
    } catch (e) {
      console.error("[DB PATH] seedDemoData: Error seeding Firestore:", e);
    }
  } else {
    console.log("[DB PATH] seedDemoData: Seeding mock complaints to persistent mock file-based database.");
  }

  // Seed to mock db file
  const seeded: Record<string, Complaint> = {};
  MOCK_COMPLAINTS.forEach((c) => {
    seeded[c.complaintId] = { 
      ...c, 
      createdAt: new Date(Date.now() - c.daysElapsed * 24 * 60 * 60 * 1000).toISOString() 
    };
  });
  writeMockDb(seeded);
}
