import express from "express";
import db from "../database.js";

const router = express.Router();

/**
 * GET /api/v1/ask?q=
 */
router.get("/ask", (req, res) => {
  const q = req.query.q?.toLowerCase().trim();
  if (!q)
    return res.json({ status: "error", message: "Question required" });

  db.run(`UPDATE stats SET total_interactions = total_interactions + 1`);

  db.get(
    "SELECT * FROM simsimi WHERE question = ?",
    [q],
    (err, row) => {
      if (row) {
        res.json({
          status: "success",
          response: row.answer,
          needs_teaching: false,
          taught_count: row.taught_count
        });
      } else {
        res.json({
          status: "success",
          response: "🤖 I don't know yet. Teach me!",
          needs_teaching: true
        });
      }
    }
  );
});

/**
 * POST /api/v1/teach
 * { question, answer }
 */
router.post("/teach", (req, res) => {
  const question = req.body.question?.toLowerCase().trim();
  const answer = req.body.answer?.trim();

  if (!question || !answer) {
    return res.json({ status: "error", message: "Invalid payload" });
  }

  db.get(
    "SELECT * FROM simsimi WHERE question = ?",
    [question],
    (err, row) => {
      if (row) {
        db.run(
          "UPDATE simsimi SET answer = ?, taught_count = taught_count + 1 WHERE question = ?",
          [answer, question],
          () => {
            res.json({
              status: "success",
              message: "Updated knowledge"
            });
          }
        );
      } else {
        db.run(
          "INSERT INTO simsimi (question, answer) VALUES (?, ?)",
          [question, answer],
          () => {
            res.json({
              status: "success",
              message: "New knowledge saved"
            });
          }
        );
      }
    }
  );
});

/**
 * GET /api/v1/stats
 */
router.get("/stats", (req, res) => {
  db.get(`SELECT COUNT(*) as taught FROM simsimi`, (_, taught) => {
    db.get(`SELECT total_interactions FROM stats`, (_, stats) => {
      res.json({
        status: "success",
        data: {
          total_responses: taught.taught,
          taught_responses: taught.taught,
          total_interactions: stats.total_interactions,
          avg_response_time_ms: 0
        }
      });
    });
  });
});

export default router;