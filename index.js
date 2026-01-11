import express from "express";
import cors from "cors";
import path from "path";
import simsimiRoutes from "./routes/simsimi.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", simsimiRoutes);
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.resolve("public/index.html"));
});

app.listen(PORT, () =>
  console.log("✅ SimSimi running on port", PORT)
);