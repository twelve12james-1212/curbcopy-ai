import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const TONE_INSTRUCTIONS = {
  "Luxury & prestige": `Write in an elevated, aspirational tone. Use sophisticated vocabulary. Emphasize exclusivity, craftsmanship, and lifestyle. Avoid anything that sounds common or ordinary. Headlines should feel premium and evocative. Social posts should appeal to discerning buyers who appreciate the finer things.`,

  "Family & lifestyle": `Write in a warm, inviting tone. Focus on livability — schools, neighborhood, space for kids, community feel. Use language that paints a picture of daily life in the home. Headlines should feel welcoming and relatable. Social posts should speak to parents and families imagining their life there.`,

  "Investment opportunity": `Write in a data-driven, ROI-focused tone. Emphasize rental potential, appreciation, cap rate, location fundamentals, and low-maintenance features. Use language that appeals to investors and landlords. Headlines should highlight value and opportunity. Social posts should speak to portfolio builders and wealth-minded buyers.`,

  "Vacation & second home": `Write in a relaxed, aspirational tone that evokes escape, retreat, and enjoyment. Emphasize proximity to nature, amenities, and the feeling of getting away. Mention short-term rental potential where relevant. Headlines should feel like an invitation. Social posts should inspire wanderlust and lifestyle desire.`,

  "Professional / MLS": `Write in clean, factual, neutral real estate language. Lead with key specs. Avoid flowery language. Suitable for MLS submissions, Zillow, and Realtor.com. Headlines should be informative and direct. Social posts should be professional and clear with minimal embellishment.`,

  "First-time buyer": `Write in an encouraging, accessible tone. Avoid jargon. Acknowledge that buying a home is exciting and a big step. Emphasize move-in readiness, value, and approachability. Headlines should feel welcoming and non-intimidating. Social posts should be friendly, relatable, and motivating.`,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { propType, address, price, sqft, beds, baths, yearBuilt, features, notes, tone } = req.body;

  if (!propType) {
    return res.status(400).json({ error: "Property type is required" });
  }

  const toneInstruction = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS["Professional / MLS"];

  const prompt = `You are a professional real estate copywriter. Generate compelling listing content for the property below.

TONE DIRECTIVE — this is the most important instruction. Every piece of content must fully reflect this tone:
${toneInstruction}

PROPERTY DETAILS:
Type: ${propType}
${address ? `Location: ${address}` : ""}
${price ? `Price: ${price}` : ""}
${sqft ? `Square footage: ${sqft}` : ""}
${beds ? `Bedrooms: ${beds}` : ""}
${baths ? `Bathrooms: ${baths}` : ""}
${yearBuilt ? `Year built: ${yearBuilt}` : ""}
${features?.length ? `Key features: ${features.join(", ")}` : ""}
${notes ? `Additional notes: ${notes}` : ""}

Return ONLY a valid JSON object (no markdown, no backticks, no preamble) with this exact structure:
{
  "headlines": ["headline1","headline2","headline3","headline4","headline5"],
  "description": "Full property description written entirely in the specified tone. Minimum 3-4 sentences.",
  "linkedin": {"headline":"LinkedIn post headline","post":"Full LinkedIn post — professional platform, 3-4 short paragraphs, written in the specified tone"},
  "facebook": {"headline":"Facebook post headline","post":"Facebook post — conversational, use 2-3 relevant emojis, written in the specified tone"},
  "instagram": {"headline":"Instagram caption headline","post":"Instagram caption — punchy opening line, emojis throughout, relevant hashtags at the end, written in the specified tone"}
}`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("Anthropic API error:", err);
    return res.status(500).json({ error: err.message || "Generation failed" });
  }
}
