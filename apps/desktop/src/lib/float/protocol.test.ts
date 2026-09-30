import { describe, expect, it } from "vitest";

import { floatPanelFrom, floatUrl, floatWindowName, isFloatMessage } from "@/lib/float/protocol";

/**
 * Phase 7 of the dynamic screen: the address of a panel's own window, and what the two windows accept
 * from each other. The native side opens a window for this one address shape (`is_float_url` in
 * `src-tauri/src/main.rs`), so the two must agree.
 */
describe("the address of a panel's window", () => {
  it("is this origin's root with one parameter, and reads back as the same panel", () => {
    const url = floatUrl("activity.jobs", "http://127.0.0.1:8765");
    expect(url).toBe("http://127.0.0.1:8765/?float=activity.jobs");
    expect(floatPanelFrom(new URL(url).search)).toBe("activity.jobs");
  });

  it("is the app for anything that does not name a panel that can float", () => {
    expect(floatPanelFrom("")).toBeNull();
    expect(floatPanelFrom("?float=")).toBeNull();
    expect(floatPanelFrom("?float=nonsense")).toBeNull();
    // Real panels that never leave their place are not windows either.
    expect(floatPanelFrom("?float=sessions")).toBeNull();
    expect(floatPanelFrom("?float=composer.config")).toBeNull();
  });

  it("names one window per panel, so opening it again focuses the one already open", () => {
    expect(floatWindowName("activity.jobs")).toBe(floatWindowName("activity.jobs"));
    expect(floatWindowName("activity.jobs")).not.toBe(floatWindowName("activity.tools"));
  });
});

describe("what crosses the channel", () => {
  it("takes the four messages, each only with a panel that exists", () => {
    expect(isFloatMessage({ type: "hello", panel: "activity.tools" })).toBe(true);
    expect(isFloatMessage({ type: "closed", panel: "activity.jobs" })).toBe(true);
    expect(isFloatMessage({ type: "return", panel: "activity.machine" })).toBe(true);
    expect(isFloatMessage({ type: "agent", state: { status: "idle", tools: [], report: null, busy: false } })).toBe(true);
  });

  it("refuses anything else", () => {
    expect(isFloatMessage(null)).toBe(false);
    expect(isFloatMessage("hello")).toBe(false);
    expect(isFloatMessage({ type: "hello", panel: "sessions" })).toBe(false);
    expect(isFloatMessage({ type: "closed" })).toBe(false);
    expect(isFloatMessage({ type: "agent", state: { tools: "no" } })).toBe(false);
    expect(isFloatMessage({ type: "navigate", url: "https://example.com" })).toBe(false);
  });
});
