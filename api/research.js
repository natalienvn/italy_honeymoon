function buildSystemPrompt(category, place) {
  const noun = category ? String(category).toLowerCase() : "option";
  const placePhrase = place ? ` in ${place}` : "";
  return `You are a travel research assistant helping someone compare ${noun} options${placePhrase} while planning a trip.

Use web search to find real, current information. Do not invent options, prices, ratings, or reviews — only include what you find real evidence for through search.

After searching, respond with ONLY a JSON array (no markdown fences, no commentary) of up to 5 options, in this exact shape:
[
  {
    "name": "",
    "priceRange": "",
    "rating": "",
    "summary": "",
    "pros": ["", ""],
    "cons": ["", ""],
    "sourceUrl": ""
  }
]

Rules:
- "priceRange": e.g. "$180–220/night" or "$$" or "" if you couldn't find pricing.
- "rating": e.g. "4.6/5 (1,200 reviews) on Google" or "" if unavailable.
- "summary": one or two plain sentences describing the option.
- "pros" / "cons": 2–4 short bullet points each, grounded in what actual reviews or sources say.
- "sourceUrl": a real URL from your search results if you have one, else "".
- If you can't find good real options, return an empty array [] rather than guessing or padding the list.`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { query, category, place } = req.body || {};
  if (!query || !String(query).trim()) {
    res.status(400).json({ error: "Provide a search query" });
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
        max_tokens: 2000,
        system: buildSystemPrompt(category, place),
        messages: [{ role: "user", content: String(query) }],
        tools: [{ type: "web_search_20250305", name: "web_search" }],
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

    let results;
    try {
      const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      results = JSON.parse(cleaned);
      if (!Array.isArray(results)) throw new Error("not an array");
    } catch {
      res.status(500).json({ error: "Couldn't understand the search results. Try a different search." });
      return;
    }

    res.status(200).json({ results });
  } catch (err) {
    res.status(500).json({ error: "Search request failed" });
  }
}
