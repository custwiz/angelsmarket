import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import productsRouter from "./routes/products";
import addressesRouter from "./routes/addresses";
import { ensureMongoConnection } from "./utils/mongo";
import { seedProductsFromStaticData } from "./utils/seed";
import morgan from "morgan";
dotenv.config();

const app = express();
app.use(morgan("dev"));
const PORT = process.env.PORT || 6000;
// const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const CLIENT_URL = process.env.CLIENT_URL || "https://shop.angelsonearthhub.com";

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/products", productsRouter);
app.use("/api/addresses", addressesRouter);

(async () => {
  try {
    await ensureMongoConnection();
    await seedProductsFromStaticData();

    app.listen(PORT, () => {
      console.log(`API server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
})();
