import sqlite3
import os

for db_path in ["dev.db", "prisma/dev.db"]:
    db = sqlite3.connect(db_path)
    cursor = db.cursor()

    sql = """
    CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "avatar" TEXT,
        "phone" TEXT,
        "role" TEXT NOT NULL DEFAULT 'customer',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

    CREATE TABLE IF NOT EXISTS "Address" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "fullName" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "street" TEXT NOT NULL,
        "city" TEXT NOT NULL,
        "state" TEXT NOT NULL,
        "country" TEXT NOT NULL DEFAULT 'Nigeria',
        "isDefault" BOOLEAN NOT NULL DEFAULT 0,
        FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "Category" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "icon" TEXT,
        "image" TEXT,
        "color" TEXT,
        "parentId" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("parentId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON "Category"("slug");

    CREATE TABLE IF NOT EXISTS "Product" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "brand" TEXT NOT NULL,
        "price" REAL NOT NULL,
        "discountPrice" REAL,
        "stock" INTEGER NOT NULL DEFAULT 0,
        "sku" TEXT,
        "images" TEXT NOT NULL,
        "specs" TEXT,
        "tags" TEXT,
        "rating" REAL NOT NULL DEFAULT 0,
        "numReviews" INTEGER NOT NULL DEFAULT 0,
        "soldCount" INTEGER NOT NULL DEFAULT 0,
        "categoryId" TEXT NOT NULL,
        "isFlashSale" BOOLEAN NOT NULL DEFAULT 0,
        "flashSaleEndsAt" DATETIME,
        "isFeatured" BOOLEAN NOT NULL DEFAULT 0,
        "isBestSeller" BOOLEAN NOT NULL DEFAULT 0,
        "isNewArrival" BOOLEAN NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "Product_slug_key" ON "Product"("slug");

    CREATE TABLE IF NOT EXISTS "Review" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "productId" TEXT NOT NULL,
        "rating" INTEGER NOT NULL,
        "comment" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "Cart" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "Cart_userId_key" ON "Cart"("userId");

    CREATE TABLE IF NOT EXISTS "CartItem" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "cartId" TEXT NOT NULL,
        "productId" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY ("cartId") REFERENCES "Cart" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "Order" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "orderNumber" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'confirmed',
        "subtotal" REAL NOT NULL,
        "shipping" REAL NOT NULL DEFAULT 0,
        "discount" REAL NOT NULL DEFAULT 0,
        "total" REAL NOT NULL,
        "shippingAddress" TEXT NOT NULL,
        "paymentMethod" TEXT NOT NULL DEFAULT 'card',
        "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
        "estimatedDelivery" DATETIME,
        "carrier" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "Order_orderNumber_key" ON "Order"("orderNumber");

    CREATE TABLE IF NOT EXISTS "TrackingEvent" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "orderId" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "note" TEXT,
        "location" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "OrderItem" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "orderId" TEXT NOT NULL,
        "productId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "image" TEXT NOT NULL,
        "price" REAL NOT NULL,
        "quantity" INTEGER NOT NULL,
        FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "WishlistItem" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "productId" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "WishlistItem_userId_productId_key" ON "WishlistItem"("userId", "productId");
    """

    cursor.executescript(sql)
    db.commit()
    db.close()
    print(f"Initialized SQLite database at {db_path}")
