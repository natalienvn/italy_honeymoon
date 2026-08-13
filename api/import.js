import mammoth from "mammoth";

function buildSystemPrompt(legs) {
  const validLegs = Array.isArray(legs) ? legs.filter((l) => l && l.id && l.label) : [];
  const regionEnum = ['"general"', ...validLegs.map((l) => `"${l.id}"`)].join(" | ");
  const regionGuide = validLegs.length
    ? `Infer "region" from any city, address, or landmark mentioned, matching it to one of this trip's destinations: ${validLegs
        .map((l) => `"${l.id}" (${l.label})`)
        .join(", ")}. If nothing matches clearly, use "general".`
    : `This trip has no destinations set up yet, so use "general" for every item's region.`;

  return `You extract already-booked travel information from documents or pasted text \
(emails, confirmations, itineraries, screenshots) for a trip.

Respond with ONLY a single JSON object, no markdown fences, no commentary, matching exactly this shape:

{
  "flights": [
    { "direction": "outbound" | "return", "date": "", "time": "", "route": "", "arrivalDate": "", "arrivalTime": "" }
  ],
  "hotels": [
    { "name": "", "region": ${regionEnum}, "when": "", "confirmation": "", "notes": "" }
  ],
  "restaurants": [
    { "name": "", "region": ${regionEnum}, "when": "", "confirmation": "", "notes": "" }
  ],
  "experiences": [
    { "name": "", "region": ${regionEnum}, "when": "", "confirmation": "", "notes": "" }
  ]
}

Rules:
- Only include items you can actually find evidence for. Never invent bookings.
- If a category has nothing, return an empty array for it.
- "route" for flights should look like "JFK → CDG".
- ${regionGuide}
- "notes" can include address, phone, or any other detail worth keeping; leave it "" if there's nothing extra.
- Leave any field "" if it isn't present in the source rather than guessing.
- Dates and times can stay in whatever format the source uses.`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { text, file, legs } = req.body || {};
  if ((!text || !text.trim()) && !file) {
    res.status(400).json({ error: "Provide text or a file" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server is missing the ANTHROPIC_API_KEY environment variable" });
    return;
  }

  const contentBlocks = [];

  if (file) {
    const { name = "upload", mediaType = "", content = "", isBinary } = file;
    try {
      if (!isBinary) {
        contentBlocks.push({ type: "text", text: `Document "${name}":\n\n${content}` });
      } else if (mediaType === "application/pdf") {
        contentBlocks.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: content } });
      } else if (mediaType.startsWith("image/")) {
        contentBlocks.push({ type: "image", source: { type: "base64", media_type: mediaType, data: content } });
      } else if (
        mediaType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        name.toLowerCase().endsWith(".docx")
      ) {
        const buffer = Buffer.from(content, "base64");
        const { value: docText } = await mammoth.extractRawText({ buffer });
        if (!docText || !docText.trim()) {
          res.status(400).json({ error: "Couldn't find any text in that Word document." });
          return;
        }
        contentBlocks.push({ type: "text", text: `Document "${name}":\n\n${docText}` });
      } else {
        res.status(400).json({
          error: `Unsupported file type${mediaType ? ` (${mediaType})` : ""}. Try a PDF, Word doc (.docx), image, or plain text file, or paste the text instead.`,
        });
        return;
      }
    } catch (err) {
      res.status(400).json({ error: "Couldn't read that file. Try pasting the text instead." });
      return;
    }
  }

  if (text && text.trim()) {
    contentBlocks.push({ type: "text", text });
  }

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 2000,
        system: buildSystemPrompt(legs),
        messages: [{ role: "user", content: contentBlocks }],
      }),
    });

    const json = await anthropicRes.json();

    if (!anthropicRes.ok) {
      const message = (json && json.error && json.error.message) || "Anthropic API error";
      res.status(anthropicRes.status).json({ error: message });
      return;
    }

    const rawText = (json.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    let parsed;
    try {
      const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      res.status(500).json({ error: "Couldn't understand what was found. Try again, or paste the text directly instead of uploading a file." });
      return;
    }

    res.status(200).json({ result: parsed });
  } catch (err) {
    res.status(500).json({ error: "Request to Anthropic failed" });
  }
}
