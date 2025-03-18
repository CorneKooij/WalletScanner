import express from "express";
import { registerRoutes } from "./routes";

const app = express();
const PORT = process.env.PORT || 3000;

registerRoutes(app).then((server) => {
  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});
