import {
  cn,
  generateCode,
  minutesToTimeEstimateString,
  snakeCaseToTitleCase,
  timeEstimateStringToMinutes,
} from "@/lib/utils";

describe("lib/utils", () => {
  it("merges class names with tailwind conflict resolution", () => {
    expect(cn("px-2 py-1", false && "hidden", "px-4")).toBe("py-1 px-4");
  });

  it("generates a code with the requested length and valid characters", () => {
    const code = generateCode(24);

    expect(code).toHaveLength(24);
    expect(code).toMatch(/^[A-Za-z0-9]+$/);
  });

  it("converts snake case values to title case", () => {
    expect(snakeCaseToTitleCase("in_progress_task")).toBe("In Progress Task");
  });

  it("parses mixed time estimate strings into minutes", () => {
    expect(timeEstimateStringToMinutes("1w 2d 3h 15m")).toBe(13_155);
  });

  it("formats minutes back into a readable time estimate string", () => {
    expect(minutesToTimeEstimateString(13_155)).toBe("1w 2d 3h 15m");
  });

  it("returns an empty string when there is no duration to format", () => {
    expect(minutesToTimeEstimateString(0)).toBe("");
  });
});
