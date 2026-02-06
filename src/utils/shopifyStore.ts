import { db } from "../config/firebase";
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import type { ShopifyCredentials } from "./shopifyTypes";

const SHOPIFY_COLLECTION = "shopifyIntegrations";

/**
 * Save Shopify credentials to Firestore
 */
export const saveShopifyCredentials = async (
  userId: string,
  shopName: string,
  accessToken: string
): Promise<ShopifyCredentials> => {
  const credentials: ShopifyCredentials = {
    shopName,
    accessToken,
    userId,
    connectedAt: Date.now(),
    lastSync: 0,
  };

  try {
    const docRef = doc(db, SHOPIFY_COLLECTION, userId);
    await setDoc(docRef, credentials);
    return credentials;
  } catch (error) {
    console.error("Error saving Shopify credentials:", error);
    throw error;
  }
};

/**
 * Get Shopify credentials for a user
 */
export const getShopifyCredentials = async (
  userId: string
): Promise<ShopifyCredentials | null> => {
  try {
    const docRef = doc(db, SHOPIFY_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as ShopifyCredentials) : null;
  } catch (error) {
    console.error("Error fetching Shopify credentials:", error);
    return null;
  }
};

/**
 * Update last sync timestamp
 */
export const updateLastSyncTime = async (
  userId: string,
  timestamp: number
): Promise<void> => {
  try {
    const docRef = doc(db, SHOPIFY_COLLECTION, userId);
    await setDoc(docRef, { lastSync: timestamp }, { merge: true });
  } catch (error) {
    console.error("Error updating sync time:", error);
    throw error;
  }
};

/**
 * Disconnect Shopify (remove credentials)
 */
export const disconnectShopify = async (userId: string): Promise<void> => {
  try {
    const docRef = doc(db, SHOPIFY_COLLECTION, userId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error disconnecting Shopify:", error);
    throw error;
  }
};

/**
 * Check if Shopify is connected for a user
 */
export const isShopifyConnected = async (userId: string): Promise<boolean> => {
  const credentials = await getShopifyCredentials(userId);
  return credentials !== null;
};

/**
 * Get all connected Shopify integrations (for admin purposes)
 */
export const getAllConnectedShopify = async (): Promise<
  ShopifyCredentials[]
> => {
  try {
    const collectionRef = collection(db, SHOPIFY_COLLECTION);
    const snapshot = await getDocs(collectionRef);
    return snapshot.docs.map((doc) => doc.data() as ShopifyCredentials);
  } catch (error) {
    console.error("Error fetching all Shopify integrations:", error);
    return [];
  }
};
