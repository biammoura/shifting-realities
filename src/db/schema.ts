
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).defaultNow().notNull(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  }).defaultNow().notNull(),
};

export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  avatarUrl: text("avatar_url"),
  pinHash: text("pin_hash"),
  theme: jsonb("theme").$type<Record<string, unknown>>()
    .default({}).notNull(),
  settings: jsonb("settings").$type<Record<string, unknown>>()
    .default({}).notNull(),
  ...timestamps,
});

export const universes = pgTable(
  "universes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    sourceCanon: text("source_canon"),
    canonSettings: jsonb("canon_settings")
      .$type<Record<string, unknown>>()
      .default({}).notNull(),
    narrativeSettings: jsonb("narrative_settings")
      .$type<Record<string, unknown>>()
      .default({}).notNull(),
    narrativeTime: timestamp("narrative_time", {
      withTimezone: true,
    }).defaultNow().notNull(),
    isArchived: boolean("is_archived").default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    index("universes_profile_idx").on(table.profileId),
  ]
);

export const characters = pgTable(
  "characters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    universeId: uuid("universe_id")
      .notNull()
      .references(() => universes.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 150 }).notNull(),
    username: varchar("username", { length: 80 }).notNull(),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    appearance: text("appearance"),
    personality: jsonb("personality")
      .$type<Record<string, unknown>>()
      .default({}).notNull(),
    background: text("background"),
    privateNotes: text("private_notes"),
    isAvatar: boolean("is_avatar").default(false).notNull(),
    isMajor: boolean("is_major").default(false).notNull(),
    isAiControlled: boolean("is_ai_controlled")
      .default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("characters_universe_username_idx")
      .on(table.universeId, table.username),
  ]
);

export const relationships = pgTable(
  "relationships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    universeId: uuid("universe_id")
      .notNull()
      .references(() => universes.id, { onDelete: "cascade" }),
    sourceCharacterId: uuid("source_character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    targetCharacterId: uuid("target_character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    relationshipType: varchar("relationship_type", {
      length: 80,
    }),
    affection: integer("affection").default(0).notNull(),
    trust: integer("trust").default(0).notNull(),
    attraction: integer("attraction").default(0).notNull(),
    tension: integer("tension").default(0).notNull(),
    privateFeelings: text("private_feelings"),
    history: jsonb("history")
      .$type<unknown[]>()
      .default([]).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("relationships_direction_idx").on(
      table.sourceCharacterId,
      table.targetCharacterId
    ),
  ]
);

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    universeId: uuid("universe_id")
      .notNull()
      .references(() => universes.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    media: jsonb("media").$type<unknown[]>()
      .default([]).notNull(),
    taggedCharacterIds: jsonb("tagged_character_ids")
      .$type<string[]>()
      .default([]).notNull(),
    location: text("location"),
    visibility: varchar("visibility", { length: 30 })
      .default("public").notNull(),
    narrativeContext: text("narrative_context"),
    narrativeTime: timestamp("narrative_time", {
      withTimezone: true,
    }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("posts_universe_time_idx").on(
      table.universeId,
      table.narrativeTime
    ),
  ]
);

export const postInteractions = pgTable(
  "post_interactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    characterId: uuid("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 40 }).notNull(),
    content: text("content"),
    ...timestamps,
  }
);

export const stories = pgTable(
  "stories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    universeId: uuid("universe_id")
      .notNull()
      .references(() => universes.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    content: jsonb("content")
      .$type<Record<string, unknown>>()
      .default({}).notNull(),
    narrativeTime: timestamp("narrative_time", {
      withTimezone: true,
    }).notNull(),
    expiresAtNarrativeTime: timestamp(
      "expires_at_narrative_time",
      { withTimezone: true }
    ).notNull(),
    ...timestamps,
  }
);

export const storyInteractions = pgTable(
  "story_interactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storyId: uuid("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "cascade" }),
    characterId: uuid("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 40 }).notNull(),
    content: jsonb("content").$type<Record<string, unknown>>()
      .default({}).notNull(),
    ...timestamps,
  }
);

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    universeId: uuid("universe_id")
      .notNull()
      .references(() => universes.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 150 }),
    isGroup: boolean("is_group").default(false).notNull(),
    ...timestamps,
  }
);

export const conversationMembers = pgTable(
  "conversation_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    characterId: uuid("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("conversation_member_unique_idx").on(
      table.conversationId,
      table.characterId
    ),
  ]
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    media: jsonb("media").$type<unknown[]>()
      .default([]).notNull(),
    narrativeTime: timestamp("narrative_time", {
      withTimezone: true,
    }).notNull(),
    ...timestamps,
  }
);

export const characterMemories = pgTable(
  "character_memories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    universeId: uuid("universe_id")
      .notNull()
      .references(() => universes.id, { onDelete: "cascade" }),
    characterId: uuid("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    memoryType: varchar("memory_type", { length: 50 })
      .default("experience").notNull(),
    importance: integer("importance").default(50).notNull(),
    isBelief: boolean("is_belief").default(false).notNull(),
    isSecret: boolean("is_secret").default(false).notNull(),
    sourceEventId: uuid("source_event_id"),
    ...timestamps,
  },
  (table) => [
    index("character_memories_character_idx")
      .on(table.characterId),
  ]
);

export const characterThoughts = pgTable(
  "character_thoughts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    universeId: uuid("universe_id")
      .notNull()
      .references(() => universes.id, { onDelete: "cascade" }),
    characterId: uuid("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    contextType: varchar("context_type", { length: 50 }),
    contextId: uuid("context_id"),
    narrativeTime: timestamp("narrative_time", {
      withTimezone: true,
    }).notNull(),
    ...timestamps,
  }
);

export const narrativeEvents = pgTable(
  "narrative_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    universeId: uuid("universe_id")
      .notNull()
      .references(() => universes.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description").notNull(),
    options: jsonb("options").$type<unknown[]>()
      .default([]).notNull(),
    outcome: jsonb("outcome")
      .$type<Record<string, unknown>>(),
    isResolved: boolean("is_resolved")
      .default(false).notNull(),
    narrativeTime: timestamp("narrative_time", {
      withTimezone: true,
    }).notNull(),
    ...timestamps,
  }
);

export const storyArcs = pgTable(
  "story_arcs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    universeId: uuid("universe_id")
      .notNull()
      .references(() => universes.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    secretPlan: text("secret_plan"),
    publicSummary: text("public_summary"),
    status: varchar("status", { length: 40 })
      .default("planned").notNull(),
    isRevealed: boolean("is_revealed")
      .default(false).notNull(),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default({}).notNull(),
    ...timestamps,
  }
);

export const encyclopediaEntries = pgTable(
  "encyclopedia_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    universeId: uuid("universe_id")
      .notNull()
      .references(() => universes.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    content: text("content").notNull(),
    isHidden: boolean("is_hidden")
      .default(false).notNull(),
    category: varchar("category", { length: 80 }),
    ...timestamps,
  }
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    universeId: uuid("universe_id")
      .notNull()
      .references(() => universes.id, { onDelete: "cascade" }),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 60 }).notNull(),
    title: text("title").notNull(),
    body: text("body"),
    targetPath: text("target_path"),
    isRead: boolean("is_read").default(false).notNull(),
    ...timestamps,
  }
);

export const canonVersions = pgTable(
  "canon_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    universeId: uuid("universe_id")
      .notNull()
      .references(() => universes.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    description: text("description"),
    snapshot: jsonb("snapshot").$type<Record<string, unknown>>()
      .notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("canon_versions_unique_idx").on(
      table.universeId,
      table.versionNumber
    ),
  ]
);
