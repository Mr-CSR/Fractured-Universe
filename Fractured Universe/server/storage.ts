import { db } from "./db";
import { highScores, type InsertHighScore, type HighScore } from "@shared/schema";
import { desc } from "drizzle-orm";

export interface IStorage {
  getHighScores(): Promise<HighScore[]>;
  createHighScore(score: InsertHighScore): Promise<HighScore>;
}

export class DatabaseStorage implements IStorage {
  async getHighScores(): Promise<HighScore[]> {
    return await db.select()
      .from(highScores)
      .orderBy(desc(highScores.score))
      .limit(10);
  }

  async createHighScore(score: InsertHighScore): Promise<HighScore> {
    const [newScore] = await db.insert(highScores)
      .values(score)
      .returning();
    return newScore;
  }
}

export const storage = new DatabaseStorage();
