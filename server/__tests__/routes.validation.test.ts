import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";

// Ensure required env is present before importing route dependencies
process.env.BLOCKFROST_API_KEY = process.env.BLOCKFROST_API_KEY || "test-key";

// Dynamic import after env setup to avoid early process.exit in service module
const { registerRoutes } = await import("../routes");

async function makeServer() {
  const app = express();
  app.use(express.json());
  const httpServer = await registerRoutes(app);
  return httpServer;
}

describe("API route validations", () => {
  it("rejects invalid cardano address on /info", async () => {
    const server = await makeServer();
    const res = await request(server).get("/api/wallet/not-an-addr/info");
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Invalid Cardano address/i);
  });

  it("returns 404 for wallet not found in legacy route", async () => {
    const server = await makeServer();
    const res = await request(server).get(
      "/api/wallet/addr1q" + "x".repeat(90)
    );
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/Use \/api\/wallet\/.*\/info first/i);
  });

  it("returns 404 for transactions when wallet not cached", async () => {
    const server = await makeServer();
    const res = await request(server).get(
      "/api/wallet/addr1q" + "y".repeat(90) + "/transactions"
    );
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/Wallet not found/i);
  });

  it("returns 404 for nfts when wallet not cached", async () => {
    const server = await makeServer();
    const res = await request(server).get(
      "/api/wallet/addr1q" + "z".repeat(90) + "/nfts"
    );
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/Wallet not found/i);
  });
});
