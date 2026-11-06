import { readFileSync } from "fs";
import { join } from "path";

const read = (f: string) => readFileSync(join(__dirname, "..", "public", f), "utf8");

/** Groups of consecutive User-agent lines with the rules that follow them. */
function parseRobots(txt: string) {
  const groups: { agents: string[]; allow: string[]; disallow: string[] }[] = [];
  let current: (typeof groups)[number] | null = null;
  for (const raw of txt.split("\n")) {
    const line = raw.replace(/#.*/, "").trim();
    const m = line.match(/^([\w-]+):\s*(.*)$/);
    if (!m) continue;
    const [, key, value] = m;
    const k = key.toLowerCase();
    if (k === "user-agent") {
      if (!current || current.allow.length || current.disallow.length) {
        current = { agents: [], allow: [], disallow: [] };
        groups.push(current);
      }
      current.agents.push(value);
    } else if (current && k === "allow") current.allow.push(value);
    else if (current && k === "disallow") current.disallow.push(value);
  }
  return groups;
}

const groups = parseRobots(read("robots.txt"));
const groupFor = (agent: string) => groups.find((g) => g.agents.includes(agent));

describe("robots.txt", () => {
  it.each(["ClaudeBot", "GPTBot", "CCBot", "Google-Extended", "SemrushBot", "AhrefsBot", "ExaSearchBot"])(
    "blocks %s from everything",
    (agent) => {
      expect(groupFor(agent)?.disallow).toEqual(["/"]);
    },
  );

  it.each(["OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "Claude-SearchBot", "Claude-User", "*"])(
    "allows %s, minus /api/",
    (agent) => {
      const g = groupFor(agent);
      expect(g?.allow).toContain("/");
      expect(g?.disallow).toEqual(["/api/"]);
    },
  );

  it("does not block any URL in the sitemap for ordinary crawlers", () => {
    const disallow = groupFor("*")!.disallow;
    const urls = [...read("sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
    expect(urls.length).toBeGreaterThan(0);
    for (const path of urls) {
      expect(disallow.some((d) => path.startsWith(d))).toBe(false);
    }
  });
});
