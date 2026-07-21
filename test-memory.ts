// Test memory extraction patterns

// English memory extraction patterns
const ENGLISH_PATTERNS = {
  preference: [
    /(?:i (?:really )?(?:like|love|prefer|enjoy))\s+(.+?)(?:\.|!|$)/gi,
    /(?:my (?:favorite|fav|best))\s+(.+?)\s+(?:is|are)\s+(.+?)(?:\.|!|$)/gi,
    /(?:i (?:hate|don't like|dislike))\s+(.+?)(?:\.|!|$)/gi,
    /(?:i'm (?:into|obsessed with))\s+(.+?)(?:\.|!|$)/gi,
  ],
  hobby: [
    /(?:i (?:like|love|enjoy) (?:to )?(?:playing|reading|watching|listening|cooking|traveling|hiking|running|painting|drawing|writing|coding|gaming))\s+(.+?)(?:\.|!|$)/gi,
    /(?:my (?:hobby|hobbies|interest) (?:is|are))\s+(.+?)(?:\.|!|$)/gi,
  ],
  date: [
    /(?:my (?:birthday|birth date|bday))\s+(?:is\s+)?(.+?)(?:\.|!|$)/gi,
    /(?:our (?:anniversary|date))\s+(?:is\s+)?(.+?)(?:\.|!|$)/gi,
    /(?:i was born on)\s+(.+?)(?:\.|!|$)/gi,
  ],
  goal: [
    /(?:i (?:want to|plan to|will|hope to))\s+(.+?)(?:\.|!|$)/gi,
    /(?:my (?:goal|dream|aspiration|plan))\s+(?:is|are)\s+(.+?)(?:\.|!|$)/gi,
  ],
  fact: [
    /(?:my name is|i'm|i am)\s+(.+?)(?:\.|!|$)/gi,
    /(?:i work (?:at|for|in))\s+(.+?)(?:\.|!|$)/gi,
    /(?:i live (?:in|at))\s+(.+?)(?:\.|!|$)/gi,
    /(?:i'm (?:from|from originally))\s+(.+?)(?:\.|!|$)/gi,
    /(?:i study (?:at|in|under))\s+(.+?)(?:\.|!|$)/gi,
    /(?:i'm (?:a|an) student)\s+(?:at\s+)?(.+?)(?:\.|!|$)/gi,
  ],
  personality: [
    /(?:i am|i'm)\s+(?:a )?(?:really |very )?(?:shy|introvert|extrovert|ambivert|outgoing|quiet|loud|funny|serious|optimistic|pessimistic|romantic|practical)\s*(.+?)(?:\.|!|$)/gi,
  ],
  topic: [
    /(?:let's talk about|talk to me about|i want to discuss)\s+(.+?)(?:\.|!|$)/gi,
    /(?:i (?:want to|need to) talk about)\s+(.+?)(?:\.|!|$)/gi,
  ],
  milestone: [
    /(?:we (?:first|first time|first met))\s+(.+?)(?:\.|!|$)/gi,
    /(?:our (?:first|special))\s+(.+?)(?:\.|!|$)/gi,
  ],
};

// Tamil/Tanglish memory extraction patterns
const TANGLISH_PATTERNS = {
  preference: [
    /(?:enakku|enkku)\s+(.+?)\s+(?:romba|bayangara)?\s*(?:pudikkum|pidikkum|ishtam|favorite)/gi,
    /(?:naan|naa)\s+(.+?)\s+(?:romba|bayangara)?\s*(?:enjoy|pandren|seiyven)/gi,
    /(?:en\s+(?:favorite|fav))\s+(.+?)(?:\.|!|$)/gi,
  ],
  hobby: [
    /(?:naan|naa)\s+(.+?)\s+(?:pandren|seiyven|vilayaduven|padikken)/gi,
    /(?:en\s+(?:hobby|hobbies|interest))\s+(?:.+?)?\s*(?:romba|bayangara)?\s*(?:pudikkum|ishtam)/gi,
  ],
  date: [
    /(?:en\s+(?:birthday|pirainal|piranthanaal))\s+(?:.+?)?\s*(.+?)(?:\.|!|$)/gi,
    /(?:naan|naa)\s+(.+?)\s+(?:piranthen|poranthen)/gi,
  ],
  goal: [
    /(?:naan|naa)\s+(.+?)\s+(?:pannanum|seiyaven|aaganum)/gi,
    /(?:en\s+(?:goal|dream))\s+(?:.+?)?\s*(.+?)(?:\.|!|$)/gi,
  ],
  fact: [
    /(?:en\s+(?:per|name))\s+(?:.+?)?\s*(.+?)(?:\.|!|$)/gi,
    /(?:naan|naa)\s+(.+?)\s+(?:la irukken|la work|la study)/gi,
    /(?:naan|naa)\s+(.+?)\s+(?:irukken|irukku)/gi,
    /(?:naan|naa)\s+(.+?)\s+(?:student|engineer|doctor|teacher)/gi,
    /(?:naan|naa)\s+(?:irundhu\s+)?vandhen/i,
  ],
  personality: [
    /(?:naan|naa)\s+(?:.+?)?\s*(shy|introvert|extrovert|ambivert|outgoing|quiet|funny|serious)/gi,
  ],
  topic: [
    /(?:ippo|ini)\s+(.+?)\s+(?:pathi|patti)\s+(?:pesalaam|pesuvom|chat)/gi,
    /(?:.+?)\s+(?:pathi|patti)\s+(?:pesanum|pesalaam|solunga)/gi,
  ],
  milestone: [
    /(?:naam|namma)\s+(.+?)\s+(?:first|first time|first met)/gi,
  ],
};

// Explicit memory requests (both languages)
const EXPLICIT_PATTERNS = [
  // English
  /(?:remember|don't forget|i told you|i mentioned)\s+(?:that\s+)?(.+?)(?:\.|!|$)/gi,
  /(?:make a note|note down|save this)\s+(?:that\s+)?(.+?)(?:\.|!|$)/gi,
  // Tamil
  /(?:remember|yaad vechukonga|maathikonga|marantheengaadhaa)\s+(?:.+?)?\s*(.+?)(?:\.|!|$)/gi,
  /(?:enna pathi|en pathi)\s+(?:.+?)?\s*(?:记住|remember|solli irukken)/gi,
];

function extractMemoriesFromText(text: string) {
  const memories = [];
  const seen = new Set();

  // Extract from English patterns
  for (const [category, patterns] of Object.entries(ENGLISH_PATTERNS)) {
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(text)) !== null) {
        const value = match[1]?.trim() || match[2]?.trim();
        if (value && value.length > 2 && value.length < 200) {
          const key = `${category}_${value.toLowerCase().slice(0, 50)}`;
          if (!seen.has(key)) {
            seen.add(key);
            memories.push({ category, key, value });
          }
        }
      }
    }
  }

  // Extract from Tanglish patterns
  for (const [category, patterns] of Object.entries(TANGLISH_PATTERNS)) {
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(text)) !== null) {
        const value = match[1]?.trim() || match[2]?.trim();
        if (value && value.length > 2 && value.length < 200) {
          const key = `ta_${category}_${value.toLowerCase().slice(0, 50)}`;
          if (!seen.has(key)) {
            seen.add(key);
            memories.push({ category, key, value });
          }
        }
      }
    }
  }

  // Check for explicit memory requests
  for (const pattern of EXPLICIT_PATTERNS) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const value = match[1]?.trim();
      if (value && value.length > 2) {
        const key = `explicit_${value.toLowerCase().slice(0, 50)}`;
        if (!seen.has(key)) {
          seen.add(key);
          memories.push({ category: "fact", key, value });
        }
      }
    }
  }

  return memories;
}

// Test cases
const testCases = [
  // English tests
  "My name is Kumar and I live in Chennai.",
  "I work at Google as a software engineer.",
  "My birthday is on January 15th.",
  "I really like playing cricket.",
  "My favorite food is biryani.",
  "I want to become a pilot someday.",
  "I'm from Madurai originally.",
  "I'm a student at IIT Madras.",
  "Remember that I have a meeting tomorrow.",
  "My hobby is reading novels.",
  
  // Tanglish tests
  "En per Kumaran.",
  "Naan Chennai-la irukken.",
  "Enakku cricket romba pudikkum.",
  "En birthday January 15.",
  "Naan pilot aaganum-nu aasai padukuren.",
  "En favorite food biryani.",
  "Naan Madurai-la irundhu vandhen.",
  "Naan student IIT Madras-la.",
  "Yaad vechukonga naan meeting vekkuren naalaikku.",
  "En hobby novels padikkarthu.",
  
  // Mixed tests
  "I'm Kumar and en per Kumaran. Naan Chennai-la irukken.",
];

console.log("=== Memory Extraction Test Results ===\n");

for (const testCase of testCases) {
  console.log(`Input: "${testCase}"`);
  const memories = extractMemoriesFromText(testCase);
  if (memories.length > 0) {
    for (const memory of memories) {
      console.log(`  → [${memory.category}] ${memory.value}`);
    }
  } else {
    console.log("  → No memories extracted");
  }
  console.log();
}
