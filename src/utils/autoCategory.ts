const RULES: [string, RegExp][] = [
  ['Food', /restaurant|cafe|coffee|pizza|burger|sushi|food|dine|lunch|dinner|breakfast|grocery|supermarket|market|uber\s?eat|doordash|grubhub|chipotle|mcdonald|starbucks|dunkin|taco\s?bell|kfc|whole\s?food|trader\s?joe|kroger|safeway|aldi/i],
  ['Transport', /\buber\b(?!\s?eat)|\blyft\b|taxi|gas\s+station|fuel|parking|transit|metro|\bbus\b|amtrak|flight|airline|airport|\btoll\b|car\s?wash|auto\s?repair/i],
  ['Entertainment', /netflix|spotify|hulu|disney|hbo|apple\s?tv|prime\s?video|movie|cinema|theater|concert|gaming|\bsteam\b|playstation|xbox|nintendo|twitch|youtube\s?premium/i],
  ['Shopping', /\bamazon\b|ebay|etsy|\bwalmart\b(?!\s?grocery)|\btarget\b|best\s?buy|home\s?depot|ikea|clothing|apparel|\bshoes\b|fashion/i],
  ['Healthcare', /pharmacy|cvs|walgreens|rite\s?aid|doctor|hospital|clinic|dental|vision|\bgym\b|fitness|yoga|health\s?ins|prescription|\brx\b/i],
  ['Utilities', /electric|water\s?bill|natural\s?gas|internet|wifi|phone\s?bill|mobile\s?plan|cable|at&t|verizon|comcast|xfinity|t-mobile/i],
  ['Housing', /\brent\b|mortgage|landlord|\bhoa\b|lowes|maintenance|plumber|electrician/i],
  ['Education', /tuition|university|college|udemy|coursera|textbook|\bclass\b|training|workshop|skillshare/i],
];

export function suggestCategory(description: string): string | null {
  if (!description.trim()) return null;
  for (const [cat, re] of RULES) {
    if (re.test(description)) return cat;
  }
  return null;
}
