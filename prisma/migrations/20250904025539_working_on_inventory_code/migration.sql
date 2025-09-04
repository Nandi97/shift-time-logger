-- CreateEnum
CREATE TYPE "public"."LocationType" AS ENUM ('WAREHOUSE', 'OUTLET', 'ONLINE', 'VIRTUAL');

-- CreateEnum
CREATE TYPE "public"."TxnType" AS ENUM ('RECEIVE', 'TRANSFER_OUT', 'TRANSFER_IN', 'SALE', 'RETURN_IN', 'ADJUSTMENT', 'WRITE_OFF', 'CONSUME_INTERNAL');

-- CreateTable
CREATE TABLE "public"."Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."LocationType" NOT NULL,
    "code" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brandId" TEXT,
    "categoryId" TEXT,
    "barcodeUnit" TEXT,
    "barcodePack" TEXT,
    "packSize" INTEGER,
    "trackExpiry" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InventoryTxn" (
    "id" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" TEXT NOT NULL,
    "fromLocationId" TEXT,
    "toLocationId" TEXT,
    "qtyUnits" INTEGER NOT NULL,
    "type" "public"."TxnType" NOT NULL,
    "reason" TEXT,
    "performedById" TEXT,
    "lotCode" TEXT,
    "expiryDate" TIMESTAMP(3),
    "ref" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryTxn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_key" ON "public"."Brand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "public"."Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Location_code_key" ON "public"."Location"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "public"."Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_barcodeUnit_key" ON "public"."Product"("barcodeUnit");

-- CreateIndex
CREATE UNIQUE INDEX "Product_barcodePack_key" ON "public"."Product"("barcodePack");

-- CreateIndex
CREATE INDEX "InventoryTxn_productId_ts_idx" ON "public"."InventoryTxn"("productId", "ts");

-- CreateIndex
CREATE INDEX "InventoryTxn_fromLocationId_toLocationId_ts_idx" ON "public"."InventoryTxn"("fromLocationId", "toLocationId", "ts");

-- CreateIndex
CREATE INDEX "InventoryTxn_lotCode_expiryDate_idx" ON "public"."InventoryTxn"("lotCode", "expiryDate");

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryTxn" ADD CONSTRAINT "InventoryTxn_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryTxn" ADD CONSTRAINT "InventoryTxn_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "public"."Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryTxn" ADD CONSTRAINT "InventoryTxn_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "public"."Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryTxn" ADD CONSTRAINT "InventoryTxn_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
