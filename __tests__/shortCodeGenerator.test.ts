import { generateShortCode } from "../src/services/shortCodeGenerator";

describe("generateShortCode", () => {
  it("returns requested length and URL-safe charset", () => {
    const code = generateShortCode(10);
    expect(code).toHaveLength(10);
    expect(code).toMatch(/^[0-9A-Za-z]+$/);
  });

  it("produces different values across calls (probabilistic)", () => {
    const set = new Set<string>();
    for (let i = 0; i < 50; i++) {
      set.add(generateShortCode(12));
    }
    expect(set.size).toBeGreaterThan(40);
  });
});
