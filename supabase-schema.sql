-- Supabase SQL Schema Initialization
-- Run this in your Supabase SQL Editor to initialize the tables for the EEU Dashboard.

CREATE TABLE IF NOT EXISTS "interruptions" (
  "id" text PRIMARY KEY NOT NULL,
  "feederName" text NOT NULL,
  "district" text NOT NULL,
  "type" text NOT NULL,
  "status" text NOT NULL,
  "startTime" text NOT NULL,
  "estimatedRestorationTime" text NOT NULL,
  "affectedArea" text NOT NULL,
  "remark" text NOT NULL,
  "lastUpdated" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" text PRIMARY KEY NOT NULL,
  "feederId" text NOT NULL,
  "type" text NOT NULL,
  "title" text NOT NULL,
  "message" text NOT NULL,
  "timestamp" text NOT NULL,
  "read" boolean DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS "presetFeeders" (
  "id" text PRIMARY KEY NOT NULL,
  "feederStr" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "hubRecords" (
  "no" integer PRIMARY KEY NOT NULL,
  "region" text NOT NULL,
  "csc" text NOT NULL,
  "address" text NOT NULL,
  "dummyBp" text NOT NULL,
  "rsg" text NOT NULL,
  "dispatcherName" text NOT NULL,
  "dispatcherId" text NOT NULL,
  "customerServiceTlId" text NOT NULL,
  "officeLocation" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "teamLeaderNotes" (
  "id" text PRIMARY KEY NOT NULL,
  "content" text NOT NULL,
  "author" text NOT NULL,
  "timestamp" text NOT NULL,
  "isUrgent" boolean DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS "customerContacts" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "phone" text NOT NULL,
  "category" text NOT NULL,
  "locationInfo" text NOT NULL,
  "hotlineShortCode" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "teamLeaders" (
  "id" text PRIMARY KEY NOT NULL,
  "username" text NOT NULL,
  "password" text NOT NULL,
  "name" text NOT NULL,
  "district" text NOT NULL,
  "role" text DEFAULT 'team_leader',
  "mustChangePassword" boolean,
  "createdAt" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "feedbacks" (
  "id" text PRIMARY KEY NOT NULL,
  "rating" integer NOT NULL,
  "category" text NOT NULL,
  "feedbackText" text NOT NULL,
  "submittedBy" text NOT NULL,
  "targetEmail" text NOT NULL,
  "timestamp" text NOT NULL
);
