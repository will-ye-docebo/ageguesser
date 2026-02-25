const WORD_GROUPS = [
  {
    theme: "tempo",
    words: ["steady", "spontaneous", "iterative", "decisive", "measured", "adaptive", "deliberate", "playful", "practical", "curious"]
  },
  {
    theme: "planning",
    words: ["outline", "improvise", "calendar", "backlog", "routine", "milestone", "buffer", "sprint", "checkpoint", "flexible"]
  },
  {
    theme: "tone",
    words: ["concise", "warm", "direct", "diplomatic", "reflective", "animated", "formal", "casual", "nuanced", "literal"]
  },
  {
    theme: "learning",
    words: ["tutorial", "experiment", "discussion", "notes", "diagram", "examples", "mentor", "trial", "pattern", "framework"]
  },
  {
    theme: "space",
    words: ["cozy", "airy", "structured", "layered", "minimal", "textured", "bright", "muted", "quiet", "lively"]
  },
  {
    theme: "social",
    words: ["gathering", "oneonone", "smalltalk", "deepdive", "hosting", "listening", "debate", "teamwork", "solo", "observant"]
  },
  {
    theme: "decision",
    words: ["instinct", "evidence", "consensus", "speed", "precision", "optionality", "certainty", "exploration", "tradeoff", "simplicity"]
  },
  {
    theme: "creative",
    words: ["sketch", "prototype", "refine", "contrast", "rhythm", "palette", "shape", "narrative", "signal", "composition"]
  },
  {
    theme: "outing",
    words: ["trail", "gallery", "cafe", "market", "concert", "bookstore", "workshop", "garden", "theater", "tabletop"]
  },
  {
    theme: "taste",
    words: ["savory", "sweet", "spicy", "mild", "homemade", "takeout", "brunch", "supper", "snack", "plated"]
  },
  {
    theme: "finance",
    words: ["budget", "cushion", "upgrade", "repair", "subscription", "ownership", "invest", "save", "splurge", "frugal"]
  },
  {
    theme: "digital",
    words: ["notifications", "folders", "tabs", "shortcuts", "automation", "manual", "sync", "offline", "archive", "inbox"]
  },
  {
    theme: "workflow",
    words: ["checklist", "kanban", "mindmap", "spreadsheet", "template", "timer", "draft", "review", "publish", "retrospective"]
  },
  {
    theme: "timeframe",
    words: ["dawn", "midday", "twilight", "weekday", "weekend", "seasonal", "daily", "occasional", "regular", "bursts"]
  },
  {
    theme: "materials",
    words: ["linen", "leather", "ceramic", "steel", "timber", "glass", "matte", "gloss", "woven", "polished"]
  },
  {
    theme: "travel",
    words: ["windowaisle", "backpack", "carryon", "scenic", "efficient", "wandering", "mapped", "localdetour", "landmark", "itinerary"]
  },
  {
    theme: "wellness",
    words: ["stretching", "breathing", "strength", "mobility", "endurance", "recovery", "moderation", "consistency", "balance", "reset"]
  },
  {
    theme: "conversation",
    words: ["question", "story", "analogy", "detail", "humor", "context", "summary", "challenge", "empathy", "candor"]
  },
  {
    theme: "media",
    words: ["documentary", "thriller", "comedy", "drama", "podcasting", "newsletter", "longform", "highlights", "soundtrack", "ambient"]
  },
  {
    theme: "values",
    words: ["autonomy", "stability", "novelty", "belonging", "mastery", "security", "freedom", "patience", "momentum", "legacy"]
  }
];

const WORD_POOL = WORD_GROUPS.flatMap((group) => group.words);

if (WORD_POOL.length !== 200) {
  throw new Error(`Expected 200 words but got ${WORD_POOL.length}`);
}

if (new Set(WORD_POOL).size !== WORD_POOL.length) {
  throw new Error("Word list contains duplicates");
}
