import { describe, it, expect } from "vitest";
import { formatTokenAmount, formatADA } from "@/lib/formatUtils";

describe("formatUtils", () => {
  it("formats ADA correctly from lovelace", () => {
    const onePointFive = formatTokenAmount(1_500_000, "ADA");
    const twoPointFive = formatTokenAmount(
      "2_500_000".replace(/_/g, ""),
      "ADA"
    );
    expect(onePointFive).toMatch(/^1([.,])50$/);
    expect(twoPointFive).toMatch(/^2([.,])50$/);
  });

  it("formats zero-decimal tokens without scaling", () => {
    expect(formatTokenAmount(123456, "XYZ", 0)).toBe("123456");
  });

  it("scales decimal tokens with 6 decimals", () => {
    expect(formatTokenAmount(123456, "IAGON", 6)).toMatch(/^0([.,])123456$/);
  });

  it("formats ADA numeric string", () => {
    const out = formatADA("1234.567");
    expect(out.replace("\u00A0", " ")).toMatch(/^1([,\s])234([.,])57$/);
  });

  it("handles invalid input safely", () => {
    expect(formatADA("not-a-number")).toBe("0.00");
    expect(formatTokenAmount("bad", "ADA")).toBe("0");
  });
});
