// =========================================
// LOCAL STORAGE PRODUCT STORE (NO BACKEND)
// =========================================

export interface Product {
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
  createdAt: number;
}

/* ===========================================================
    INTERNAL: GET ALL PRODUCTS
=========================================================== */
export function getProducts(): Product[] {
  try {
    const data = localStorage.getItem("products");
    const products = data ? JSON.parse(data) : [];
    console.log("📦 getProducts:", products.length, "products found");
    if (products.length > 0) {
      products.forEach((p, i) => {
        console.log(`  Product ${i+1}:`, p.name, "stock:", p.stock, "image:", p.image ? (p.image.length/1024).toFixed(2) + "KB" : "NO");
      });
    }
    return products;
  } catch (err) {
    console.error("Error reading products:", err);
    return [];
  }
}

/* ===========================================================
    INTERNAL: SAVE ALL PRODUCTS
=========================================================== */
function saveProducts(products: Product[]) {
  try {
    const jsonStr = JSON.stringify(products);
    const sizeInKB = jsonStr.length / 1024;
    console.log("💾 Saving", products.length, "products, size:", sizeInKB.toFixed(2), "KB");
    
    localStorage.setItem("products", jsonStr);
    console.log("✅ Products saved successfully");
  } catch (err) {
    console.error("❌ Error saving products:", err);
    if (err instanceof Error && err.message.includes("QuotaExceededError")) {
      alert("Storage is full! Please delete some products or images to save new ones.");
    }
  }
}

/* ===========================================================
    ADD A NEW PRODUCT
=========================================================== */
export function addProduct(product: Omit<Product, "id" | "createdAt">) {
  const products = getProducts();

  const newProduct: Product = {
    id: "prod_" + Date.now(),
    createdAt: Date.now(),
    ...product,
  };

  console.log("➕ Adding product:", newProduct.name, "stock:", newProduct.stock, "image size:", newProduct.image ? newProduct.image.length : 0);
  
  products.push(newProduct);
  saveProducts(products);

  return newProduct;
}

/* ===========================================================
    UPDATE PRODUCT
=========================================================== */
export function updateProduct(id: string, updates: Partial<Product>) {
  const products = getProducts();
  const index = products.findIndex((p) => p.id === id);

  if (index === -1) return false;

  products[index] = { ...products[index], ...updates };
  saveProducts(products);

  return true;
}

/* ===========================================================
    DELETE PRODUCT
=========================================================== */
export function deleteProduct(id: string) {
  const products = getProducts().filter((p) => p.id !== id);
  saveProducts(products);
}

/* ===========================================================
    REDUCE STOCK (USED IN SALE SYSTEM)
=========================================================== */
export function reduceStock(id: string, qty: number) {
  const products = getProducts();
  const product = products.find((p) => p.id === id);

  if (!product) return false;

  product.stock = Math.max(product.stock - qty, 0);
  saveProducts(products);

  return true;
}

/* ===========================================================
    INCREASE STOCK (RESTOCKING)
=========================================================== */
export function increaseStock(id: string, qty: number) {
  const products = getProducts();
  const product = products.find((p) => p.id === id);

  if (!product) return false;

  product.stock = product.stock + qty;
  saveProducts(products);

  return true;
}

/* ===========================================================
    CLEAR ALL PRODUCTS (DEVELOPMENT ONLY)
=========================================================== */
export function clearAllProducts() {
  localStorage.removeItem("products");
}
