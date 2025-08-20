-- CreateTable
CREATE TABLE "public"."food_trucks" (
    "id" TEXT NOT NULL,
    "object_id" TEXT NOT NULL,
    "applicant" TEXT NOT NULL,
    "facility_type" TEXT,
    "cnn" TEXT,
    "location_description" TEXT,
    "address" TEXT,
    "block_lot" TEXT,
    "block" TEXT,
    "lot" TEXT,
    "permit" TEXT,
    "status" TEXT NOT NULL,
    "food_items" TEXT,
    "x" DOUBLE PRECISION,
    "y" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "schedule" TEXT,
    "approved" TIMESTAMP(3),
    "received" TEXT,
    "prior_permit" TEXT,
    "expiration_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_trucks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "food_trucks_object_id_key" ON "public"."food_trucks"("object_id");

-- CreateIndex
CREATE INDEX "food_trucks_applicant_idx" ON "public"."food_trucks"("applicant");

-- CreateIndex
CREATE INDEX "food_trucks_status_idx" ON "public"."food_trucks"("status");

-- CreateIndex
CREATE INDEX "food_trucks_address_idx" ON "public"."food_trucks"("address");

-- CreateIndex
CREATE INDEX "food_trucks_latitude_longitude_idx" ON "public"."food_trucks"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "food_trucks_facility_type_idx" ON "public"."food_trucks"("facility_type");
