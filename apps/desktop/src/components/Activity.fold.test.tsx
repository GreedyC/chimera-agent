import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Activity } from "@/components/Activity";
import { listJobs } from "@/lib/api";
import { FOLDED_KEY } from "@/lib/inspector-section";
import type { BackgroundJob } from "@/lib/types";
import { renderWithProviders } from "@/test/utils";

vi.mock("@/lib/api", () => ({
  listJobs: vi.fn(),
  stopJob: vi.fn(),
  // Never resolves: the machine panel renders nothing until it has a reading, and a resolved
  // `null` is not a reading — it makes React Query warn on every render in this file.
  getResources: vi.fn(() => new Promise(() => {})),
}));

function job(over: Partial<BackgroundJob>): BackgroundJob {
  return {
    id: "a1b2c3d4e5f6",
    command: "python bench/verified_cascade/run.py --stage s0",
    cwd: "/projects/chimera",
    pid: 4242,
    started_at: 1_790_000_000,
    log: "/home/.chimera/jobs/a1b2c3d4e5f6.log",
    state: "running",
    exit_code: null,
    finished_at: null,
    reported: false,
    tail: "task 12/40 ok",
    ...over,
  } as BackgroundJob;
}

/**
 * The inspector accumulates while you watch it, and the section a person is finished with is the one
 * they want out of the way. What matters here: a section folds and unfolds, the choice survives a
 * remount, and a folded section still answers the one question its header is for — how many, and
 * whether any of them went wrong. A fold that hides a failure is worse than no fold at all.
 */
describe("the foldable inspector sections", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(listJobs).mockReset();
    vi.mocked(listJobs).mockResolvedValue({ jobs: [] });
  });

  it("folds a section away and brings it back", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Activity />);

    const tools = screen.getByRole("button", { name: /Tools/i });
    expect(tools).toHaveAttribute("aria-expanded", "true");
    // Open, the answer lives in the body and NOT in the header — the same sentence twice would be
    // the header repeating what the section already says.
    expect(tools).not.toHaveTextContent("no tools this turn");
    expect(screen.getByText("no tools this turn")).toBeInTheDocument();

    await user.click(tools);
    expect(tools).toHaveAttribute("aria-expanded", "false");
    // Folded, the body is gone and the header carries the answer instead.
    expect(tools).toHaveTextContent("no tools this turn");

    await user.click(tools);
    expect(tools).toHaveAttribute("aria-expanded", "true");
    expect(tools).not.toHaveTextContent("no tools this turn");
    expect(screen.getByText("no tools this turn")).toBeInTheDocument();
  });

  it("remembers which sections are folded across a remount", async () => {
    const user = userEvent.setup();
    const first = renderWithProviders(<Activity />);
    await user.click(screen.getByRole("button", { name: /Memory/i }));
    expect(JSON.parse(localStorage.getItem(FOLDED_KEY) ?? "[]")).toContain("memory");
    first.unmount();

    renderWithProviders(<Activity />);
    expect(screen.getByRole("button", { name: /Memory/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("keeps the jobs count and the running count on the folded header", async () => {
    vi.mocked(listJobs).mockResolvedValue({
      jobs: [
        job({ id: "r1", state: "running" }),
        job({ id: "f1", state: "finished", exit_code: 0 }),
        job({ id: "f2", state: "finished", exit_code: 1 }),
      ],
    });
    const user = userEvent.setup();
    renderWithProviders(<Activity />);

    const jobs = await screen.findByRole("button", { name: /Background jobs/i });
    await user.click(jobs);

    // Three rows, one of them still running: the count of rows is history, the count of running
    // ones is the number that asks for anything.
    expect(jobs).toHaveTextContent("1 running");
    expect(jobs).toHaveTextContent("3 jobs");
    expect(screen.queryByText("python bench/verified_cascade/run.py --stage s0")).toBeNull();
  });

  it("reads a folded state that storage cannot parse as nothing folded", async () => {
    // Folding HIDES content, so a corrupt value has to fail towards visible. The alternative is a
    // panel that opens with sections missing and no way to tell why.
    localStorage.setItem(FOLDED_KEY, "{not json");
    renderWithProviders(<Activity />);

    expect(screen.getByRole("button", { name: /Tools/i })).toHaveAttribute("aria-expanded", "true");
    await waitFor(() => expect(screen.getByText("no tools this turn")).toBeInTheDocument());
  });
});
