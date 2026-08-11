export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { notes } = req.body || {};
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
        max_tokens: 1000,
        system:
          "You turn a traveler's rough, freeform notes about a single day of a trip into a clean itinerary. Output ONLY a plain list, one activity per line, each line starting with '- '. Where a time is stated or clearly implied, start the line with the time as 'H:MM AM/PM \u2014 ' before the activity; if no time applies, just describe the activity, placed in a sensible order. Do not invent activities that weren't mentioned or reasonably implied, and do not add commentary, headers, or a summary.",
        messages: [{ role: "user", content: notes }],
      }),
    });

    const json = await anthropicRes.json();

    if (!anthropicRes.ok) {
      const message = (json && json.error && json.error.message) || "Anthropic API error";
      res.status(anthropicRes.status).json({ error: message });
      return;
    }

    const text = (json.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    res.status(200).json({ text });
  } catch (err) {
    res.status(500).json({ error: "Request to Anthropic failed" });
  }
}
