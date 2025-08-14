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
    "ip" TEXT,
    "dayKey" TEXT NOT NULL DEFAULT ''
);
INSERT INTO "new_WorkLog" ("accuracyMeters", "action", "clientTime", "distanceMeters", "id", "ip", "latitude", "longitude", "timestamp", "userAgent", "userEmail", "userName", "withinGeofence") SELECT "accuracyMeters", "action", "clientTime", "distanceMeters", "id", "ip", "latitude", "longitude", "timestamp", "userAgent", "userEmail", "userName", "withinGeofence" FROM "WorkLog";
DROP TABLE "WorkLog";
ALTER TABLE "new_WorkLog" RENAME TO "WorkLog";
CREATE INDEX "WorkLog_userEmail_timestamp_idx" ON "WorkLog"("userEmail", "timestamp");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
