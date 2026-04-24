import { processData } from "../../lib/processData";

// ── Fill in your personal details here ──────────────────────────────────────
const USER_ID = "keshavjhalani_13092005"; // e.g. "johndoe_17091999"
const EMAIL_ID = "kj0650@srmist.edu.in";
const COLLEGE_ROLL_NUMBER = "RA2311003010452";
// ─────────────────────────────────────────────────────────────────────────────

export default function handler(req, res) {
  // CORS headers — allow requests from any origin
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const { data } = req.body;

  if (!Array.isArray(data)) {
    return res
      .status(400)
      .json({ error: 'Invalid request body. "data" must be an array.' });
  }

  const { hierarchies, invalidEntries, duplicateEdges, summary } =
    processData(data);

  return res.status(200).json({
    user_id: USER_ID,
    email_id: EMAIL_ID,
    college_roll_number: COLLEGE_ROLL_NUMBER,
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    summary,
  });
}
