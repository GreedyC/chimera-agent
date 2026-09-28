/**
 * Which sections of the activity inspector are folded away to their header row.
 *
 * The inspector accumulates as work proceeds: every turn adds Tools, Tokens and Memory, and a run
 * that leaves shell jobs behind adds a fourth list that goes on growing after the turn is over. A
 * column that gets taller while you watch is a column nobody reads — the section a person is
 * finished with is the one they want out of the way, and the only way to do that was to scroll past
 * it. Folding is per section and remembered, so the panel opens at the size you left it.
 *
 * One key, a JSON array of section ids. A read that throws and a read that holds rubbish both come
 * back as "nothing folded": this state HIDES content, so failing towards visible is the only safe
 * direction. `localStorage` is unavailable in a private window and in some sandboxed webviews, and
 * a preference is never worth throwing over.
 */

export const FOLDED_KEY = "chimera.inspector.folded";

/** The section ids currently folded away. Anything unreadable reads as none. */
export function readFolded(): string[] {
  try {
    const raw = localStorage.getItem(FOLDED_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/** Remember the full set of folded sections. Storage being unavailable just means the choice does
 *  not survive a restart. */
export function writeFolded(folded: readonly string[]): void {
  try {
    localStorage.setItem(FOLDED_KEY, JSON.stringify(folded));
  } catch {
    // A preference is never worth throwing mid-render.
  }
}
