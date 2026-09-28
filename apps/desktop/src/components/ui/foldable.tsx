import { useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";

import { focusRing } from "@/components/ui/focus";
import { readFolded, writeFolded } from "@/lib/inspector-section";
import { cn } from "@/lib/utils";

/**
 * A section of the activity inspector that can be folded down to its header row.
 *
 * The inspector grows while you watch it: a turn adds Tools, Tokens and Memory, and shell jobs left
 * running add a fourth list that goes on growing after the turn is over. A column that only ever
 * gets taller is a column nobody reads — the section a person is finished with is the one they want
 * out of the way, and until now the only way to get it out of the way was to scroll past it.
 *
 * Two things this deliberately does NOT do:
 *
 *   - **It does not animate its height.** Animating height forces layout on every frame and
 *     DESIGN.md forbids it outright; the body is simply rendered or not. The chevron's rotation is
 *     a `transform`, which is what the compositor can animate for free.
 *   - **It does not fold itself.** A section that collapses on its own when it gets long is one
 *     that hides the moment something goes wrong — the run that just left twenty failed jobs is
 *     exactly the run whose jobs should be on screen. Folding is the reader's decision and it is
 *     remembered, so the panel opens at the size they left it.
 *
 * The header carries `summary` — the one line that answers "is this worth opening?". Without it a
 * folded section is a label with nothing behind it, and folding becomes a way of losing track of
 * work rather than of clearing the view.
 */
export function FoldableSection({
  id,
  title,
  summary,
  children,
}: {
  /** Stable identity the folded state is remembered under. Not the title: the title is translated,
   *  and a person who switches language must not lose their layout. */
  id: string;
  title: string;
  /** The section's one-line answer, drawn beside the title while folded. */
  summary?: ReactNode;
  children: ReactNode;
}) {
  const [folded, setFolded] = useState<boolean>(() => readFolded().includes(id));

  const toggle = () => {
    const next = !folded;
    setFolded(next);
    const others = readFolded().filter((k) => k !== id);
    writeFolded(next ? [...others, id] : others);
  };

  return (
    <div className="border-t border-hairline px-4 py-3">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={!folded}
        className={cn(
          "flex w-full items-center gap-1.5 rounded-md text-left hover:bg-surface-hover",
          focusRing,
        )}
      >
        <ChevronRight
          aria-hidden="true"
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition duration-1 ease-out",
            !folded && "rotate-90",
          )}
        />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        {/* Shown while folded only: open, the section's own body is the answer and this would be
            the same number twice. `ml-auto` keeps it at the right edge whatever the title length. */}
        {folded && summary != null ? (
          <span className="ml-auto truncate text-xs text-muted-foreground">{summary}</span>
        ) : null}
      </button>
      {folded ? null : <div className="mt-2">{children}</div>}
    </div>
  );
}
