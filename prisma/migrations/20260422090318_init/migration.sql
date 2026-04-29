-- CreateTable
CREATE TABLE "articles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "source_name" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "data_source" TEXT NOT NULL DEFAULT 'BMKG',
    "category" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "day_name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "preview_text" TEXT NOT NULL,
    "body_text" TEXT NOT NULL,
    "weather_payload_json" TEXT NOT NULL,
    "draft_url" TEXT,
    "template_preference" TEXT,
    "selected_template" TEXT,
    "editorial_notes" TEXT,
    "data_completeness_note" TEXT,
    "run_type" TEXT NOT NULL,
    "triggered_by" TEXT NOT NULL,
    "generation_time" DATETIME NOT NULL,
    "requested_publish_datetime" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending Review',
    "editor_name" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "article_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "previous_status" TEXT,
    "new_status" TEXT,
    "actor_name" TEXT NOT NULL,
    "note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activity_logs_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "error_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "error_type" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "technical_details" TEXT,
    "article_id" INTEGER,
    "location" TEXT,
    "source_url" TEXT,
    "actor" TEXT,
    "result" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "error_logs_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "articles_date_idx" ON "articles"("date");

-- CreateIndex
CREATE INDEX "articles_location_idx" ON "articles"("location");

-- CreateIndex
CREATE INDEX "articles_status_idx" ON "articles"("status");

-- CreateIndex
CREATE INDEX "articles_run_type_idx" ON "articles"("run_type");

-- CreateIndex
CREATE INDEX "activity_logs_article_id_idx" ON "activity_logs"("article_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "error_logs_module_idx" ON "error_logs"("module");

-- CreateIndex
CREATE INDEX "error_logs_action_idx" ON "error_logs"("action");

-- CreateIndex
CREATE INDEX "error_logs_article_id_idx" ON "error_logs"("article_id");

-- CreateIndex
CREATE INDEX "error_logs_location_idx" ON "error_logs"("location");
