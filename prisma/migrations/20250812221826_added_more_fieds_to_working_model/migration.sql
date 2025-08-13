/*
  Warnings:

  - You are about to drop the column `name` on the `WorkLog` table. All the data in the column will be lost.
  - Added the required column `userEmail` to the `WorkLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userName` to the `WorkLog` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WorkLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userEmail" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientTime" DATETIME,
    "latitude" REAL,
    "longitude" REAL,
    "accuracyMeters" REAL,
    "distanceMeters" REAL,
    "withinGeofence" BOOLEAN,
    "userAgent" TEXT,
    "ip" TEXT
);
INSERT INTO "new_WorkLog" ("action", "id", "timestamp") SELECT "action", "id", "timestamp" FROM "WorkLog";
DROP TABLE "WorkLog";
ALTER TABLE "new_WorkLog" RENAME TO "WorkLog";
CREATE INDEX "WorkLog_userEmail_timestamp_idx" ON "WorkLog"("userEmail", "timestamp");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
