import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./prisma.js";

const connectionString = process.env.POSTGRES_URI;

if (!connectionString) {
  throw new Error("POSTGRES_URI no está definida");
}

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});
