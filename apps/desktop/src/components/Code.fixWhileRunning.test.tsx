import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Code } from "@/components/Code";
import { getFsTree, getGitStatus, getPostureFacts, getRuns, streamCodeTurn } from "@/lib/api";
import { useRunSession } from "@/lib/run-session";
import { emptyTree, gitStatus, postureFacts, scriptTurn } from "@/test/code-api-mock";
import { renderWithProviders } from "@/test/utils";

vi.mock("@/lib/api", async () => (await import("@/test/code-api-mock")).makeCodeApiMock());
vi.mock("@/lib/run-session", async () => {
  const actual = await vi.importActual<typeof import("@/lib/run-session")>("@/lib/run-session");
  return { ...actual, useRunSession: vi.fn(actual.useRunSession) };
});

/**
 * "Let the agent try to fix it" while a run is working in another project.
 *
 * Found reading the code on 2026-09-30 (R5 of the review of several conversations at once). The app
 * holds one autonomous run at a time, on purpose — `run-session.tsx` says a second is "refused rather
 * than queued", because a silent queue is a worse surprise than a disabled button. But this button
 * was not disabled: the composer only blocks for a run in THIS project, so with a run in another
 * one the button handed the fix to a session that returned without a word. Clicking it did nothing.
 *
 * Now the button is disabled while any run is working, and says why.
 */
const start = vi.fn();
const IDLE = {
  running: false, task: "", runId: null, events: [], done: null, stopping: false, broken: false,
  workspace: null, paused: null, verify: null, start, stop: () => {}, clearPaused: () => {},
};

describe("Code — the fix button while a run works elsewhere", () => {
  beforeEach(() => {
    start.mockClear();
    vi.mocked(getFsTree).mockResolvedValue(emptyTree());
    vi.mocked(getGitStatus).mockResolvedValue(gitStatus());
    vi.mocked(getRuns).mockResolvedValue([]);
    vi.mocked(getPostureFacts).mockResolvedValue(postureFacts());
    vi.mocked(streamCodeTurn).mockImplementation(
      scriptTurn({
        verified: { command: "npm test", source: "inferred:package.json", state: "failed", output: "1 failing" },
      }),
    );
  });

  async function failedTurn() {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<Code />);
    await user.type(screen.getByPlaceholderText(/^Ask about this code/), "rename it");
    await user.click(screen.getByRole("button", { name: "Send" }));
    await screen.findByText(/1 failing/);
    return user;
  }

  it("is disabled, and says why, while a run works in another project", async () => {
    vi.mocked(useRunSession).mockReturnValue({ ...IDLE, running: true, workspace: "/another-project" });
    await failedTurn();

    expect(screen.getByRole("button", { name: /Let the agent try to fix it/i })).toBeDisabled();
    expect(screen.getByText(/A run is already working/i)).toBeInTheDocument();
  });

  it("hands the fix to a run when none is working", async () => {
    vi.mocked(useRunSession).mockReturnValue(IDLE);
    const user = await failedTurn();

    await user.click(screen.getByRole("button", { name: /Let the agent try to fix it/i }));

    expect(start).toHaveBeenCalledOnce();
    expect(screen.queryByText(/A run is already working/i)).not.toBeInTheDocument();
  });
});
