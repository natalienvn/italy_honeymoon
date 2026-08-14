function buildSystemPrompt(sectionTitles) {
  const titles = Array.isArray(sectionTitles) && sectionTitles.length ? sectionTitles : ["Hotel", "Restaurants", "Experiences", "Sights", "Travel", "Notes"];
  const titleList = titles.map((t) => `"${t}"`).join(", ");
  return `You help sort a traveler's rough, freeform notes about a single day of a trip into structured sections.

This day currently has these sections: ${titleList}.

Read the notes and sort each activity or item into the single most appropriate section from that exact list. If something genuinely doesn't fit any of them, put it in a section called "Notes" instead (even though "Notes" isn't one of the given sections).

For each item, write a short description of the activity. Where a time is stated or clearly implied, include it naturally at the start of the description (e.g. "9:00 AM \u2014 Colosseum guided tour").

Respond with ONLY a JSON object (no markdown fences, no commentary) in this exact shape:
{
  "sections": [
    { "title": "<one of the exact section names given, or \"Notes\">", "items": [{ "text": "" }] }
  ]
}

Only include sections that end up with at least one item. Do not invent activities that weren't mentioned or reasonably implied by the notes.`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { notes, sectionTitles } = req.body || {};
  if (!notes || typeof notes !== "string" || !notes.trim()) {
    res.status(400).json({ error: "Missing notes" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server is missing the ANTHROPIC_API_KEY environment variable" });
    return;
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
        max_tokens: 1500,
        system: buildSystemPrompt(sectionTitles),
        messages: [{ role: "user", content: notes }],
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
      res.status(500).json({ error: "Couldn't understand the result. Try again, or add a bit more detail to your notes." });
      return;
    }

    const sections = Array.isArray(parsed.sections) ? parsed.sections : [];
    res.status(200).json({ sections });
  } catch (err) {
    res.status(500).json({ error: "Request to Anthropic failed" });
  }
}
