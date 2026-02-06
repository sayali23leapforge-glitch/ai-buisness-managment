/**
 * Firebase Firestore Product Store
 * Stores products in Firebase instead of localStorage for better persistence
 */

import { db, auth } from "../config/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";

export interface FirebaseProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  cost: number;
  stock: number;
  image: string | null;
  barcode?: string;
  qrCode?: string;
  userId: string;
  createdAt: number;
  source: "local" | "shopify" | "firebase";
}

/**
 * Add product to Firebase Firestore
 */
export async function addProductToFirebase(product: Omit<FirebaseProduct, "id" | "userId" | "createdAt">) {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("❌ No user logged in");
      return null;
    }

    const productsRef = collection(db, "users", user.uid, "products");
    const docRef = await addDoc(productsRef, {
      ...product,
      userId: user.uid,
      createdAt: Timestamp.now(),
    });

    console.log("✅ Product saved to Firebase:", docRef.id);
    return {
      id: docRef.id,
      ...product,
      userId: user.uid,
      createdAt: Date.now(),
    };
  } catch (error) {
    console.error("❌ Error saving product to Firebase:", error);
    return null;
  }
}

/**
 * Get all products from Firebase for current user
 */
export async function getFirebaseProducts(): Promise<FirebaseProduct[]> {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log("⚠️ No user logged in, returning empty products");
      return [];
    }

    const productsRef = collection(db, "users", user.uid, "products");
    const snapshot = await getDocs(productsRef);

    const products: FirebaseProduct[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      products.push({
        id: doc.id,
        name: data.name,
        category: data.category,
        description: data.description,
        price: data.price,
        cost: data.cost,
        stock: data.stock,
        image: data.image || null,
        barcode: data.barcode,
        qrCode: data.qrCode,
        userId: data.userId,
        createdAt: data.createdAt?.toMillis?.() || Date.now(),
        source: data.source || "firebase",
      });
    });

    console.log("📦 Loaded", products.length, "products from Firebase");
    return products;
  } catch (error) {
    console.error("❌ Error loading Firebase products:", error);
    return [];
  }
}

/**
 * Subscribe to real-time product updates from Firebase
 */
export function subscribeToFirebaseProducts(
  callback: (products: FirebaseProduct[]) => void
) {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log("⚠️ No user logged in");
      return () => {};
    }

    const productsRef = collection(db, "users", user.uid, "products");
    
    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
      const products: FirebaseProduct[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        products.push({
          id: doc.id,
          name: data.name,
          category: data.category,
          description: data.description,
          price: data.price,
          cost: data.cost,
          stock: data.stock,
          image: data.image || null,
          barcode: data.barcode,
          qrCode: data.qrCode,
          userId: data.userId,
          createdAt: data.createdAt?.toMillis?.() || Date.now(),
          source: data.source || "firebase",
        });
      });

      console.log("🔄 Real-time update: ", products.length, "products");
      callback(products);
    });

    return unsubscribe;
  } catch (error) {
    console.error("❌ Error subscribing to Firebase products:", error);
    return () => {};
  }
}

/**
 * Update product in Firebase
 */
export async function updateFirebaseProduct(
  productId: string,
  updates: Partial<FirebaseProduct>
) {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("❌ No user logged in");
      return false;
    }

    const productRef = doc(db, "users", user.uid, "products", productId);
    await updateDoc(productRef, updates);

    console.log("✅ Product updated in Firebase:", productId);
    return true;
  } catch (error) {
    console.error("❌ Error updating Firebase product:", error);
    return false;
  }
}

/**
 * Delete product from Firebase
 */
export async function deleteFirebaseProduct(productId: string) {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("❌ No user logged in");
      return false;
    }

    const productRef = doc(db, "users", user.uid, "products", productId);
    await deleteDoc(productRef);

    console.log("✅ Product deleted from Firebase:", productId);
    return true;
  } catch (error) {
    console.error("❌ Error deleting Firebase product:", error);
    return false;
  }
}

/**
 * Sync local products to Firebase
 * Useful for migrating from localStorage to Firebase
 */
export async function syncLocalProductsToFirebase(localProducts: any[]) {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("❌ No user logged in");
      return 0;
    }

    const productsRef = collection(db, "users", user.uid, "products");
    let synced = 0;

    for (const product of localProducts) {
      try {
        await addDoc(productsRef, {
          name: product.name,
          category: product.category,
          description: product.description,
          price: product.price,
          cost: product.cost,
          stock: product.stock,
          image: product.image || null,
          barcode: product.barcode || "",
          qrCode: product.qrCode || null,
          userId: user.uid,
          createdAt: Timestamp.now(),
          source: "local", // Mark as migrated from local
        });
        synced++;
      } catch (err) {
        console.error("Error syncing product:", product.name, err);
      }
    }

    console.log("✅ Synced", synced, "products to Firebase");
    return synced;
  } catch (error) {
    console.error("❌ Error syncing products to Firebase:", error);
    return 0;
  }
}
