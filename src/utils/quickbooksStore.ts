import { db } from "../config/firebase";
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import type { QuickBooksCredentials } from "./quickbooksTypes";

const QUICKBOOKS_COLLECTION = "quickbooksIntegrations";

/**
 * Save QuickBooks OAuth credentials to Firestore
 */
export const saveQuickBooksCredentials = async (
  userId: string,
  realmId: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<QuickBooksCredentials> => {
  const credentials: QuickBooksCredentials = {
    realmId,
    accessToken,
    refreshToken,
    userId,
    connectedAt: Date.now(),
    lastSync: 0,
    tokenExpiresAt: Date.now() + expiresIn * 1000,
  };

  try {
    const docRef = doc(db, QUICKBOOKS_COLLECTION, userId);
    await setDoc(docRef, credentials);
    return credentials;
  } catch (error) {
    console.error("Error saving QuickBooks credentials:", error);
    throw error;
  }
};

/**
 * Get QuickBooks credentials for a user
 */
export const getQuickBooksCredentials = async (
  userId: string
): Promise<QuickBooksCredentials | null> => {
  try {
    const docRef = doc(db, QUICKBOOKS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as QuickBooksCredentials) : null;
  } catch (error) {
    console.error("Error fetching QuickBooks credentials:", error);
    return null;
  }
};

/**
 * Update last sync timestamp and refresh token
 */
export const updateQuickBooksSync = async (
  userId: string,
  timestamp: number,
  newAccessToken?: string,
  newRefreshToken?: string,
  newExpiresAt?: number
): Promise<void> => {
  try {
    const updateData: any = { lastSync: timestamp };
    if (newAccessToken) updateData.accessToken = newAccessToken;
    if (newRefreshToken) updateData.refreshToken = newRefreshToken;
    if (newExpiresAt) updateData.tokenExpiresAt = newExpiresAt;

    const docRef = doc(db, QUICKBOOKS_COLLECTION, userId);
    await setDoc(docRef, updateData, { merge: true });
  } catch (error) {
    console.error("Error updating sync time:", error);
    throw error;
  }
};

/**
 * Disconnect QuickBooks (remove credentials)
 */
export const disconnectQuickBooks = async (userId: string): Promise<void> => {
  try {
    const docRef = doc(db, QUICKBOOKS_COLLECTION, userId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error disconnecting QuickBooks:", error);
    throw error;
  }
};

/**
 * Check if QuickBooks is connected for a user
 */
export const isQuickBooksConnected = async (userId: string): Promise<boolean> => {
  const credentials = await getQuickBooksCredentials(userId);
  return credentials !== null;
};

/**
 * Check if token needs refresh
 */
export const isTokenExpired = (credentials: QuickBooksCredentials): boolean => {
  return Date.now() > credentials.tokenExpiresAt;
};

/**
 * Get all connected QuickBooks integrations (for admin purposes)
 */
export const getAllConnectedQuickBooks = async (): Promise<
  QuickBooksCredentials[]
> => {
  try {
    const collectionRef = collection(db, QUICKBOOKS_COLLECTION);
    const snapshot = await getDocs(collectionRef);
    return snapshot.docs.map((doc) => doc.data() as QuickBooksCredentials);
  } catch (error) {
    console.error("Error fetching all QuickBooks integrations:", error);
    return [];
  }
};
