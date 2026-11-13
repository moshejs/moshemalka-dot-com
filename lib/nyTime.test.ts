import { handAngles, nearestEquivalent } from "./nyTime";

describe("handAngles", () => {
  it("puts 3:00:00 at a right angle", () => {
    expect(handAngles({ h: 3, m: 0, s: 0 })).toEqual({ hour: 90, minute: 0, second: 0 });
  });
  it("moves the hour hand with the minutes and the minute hand with the seconds", () => {
    const a = handAngles({ h: 10, m: 30, s: 30 });
    expect(a.hour).toBe(315);
    expect(a.minute).toBe(183);
    expect(a.second).toBe(180);
  });
});

describe("nearestEquivalent", () => {
  it("keeps the angle's position on the dial but stays near the current turn", () => {
    expect(nearestEquivalent(10, 725)).toBe(730);
    expect(nearestEquivalent(350, -5)).toBe(-10);
    expect(nearestEquivalent(90, 100)).toBe(90);
  });
});
