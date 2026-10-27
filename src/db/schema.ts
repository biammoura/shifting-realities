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
