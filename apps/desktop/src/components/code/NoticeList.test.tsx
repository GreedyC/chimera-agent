import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NoticeList } from "@/components/code/NoticeList";
import { DICTS, LANGS } from "@/lib/i18n";
import { renderWithProviders } from "@/test/utils";

/**
 * A warning is a line, not a stop and not a card.
 *
 * The turn's limits used to be silent until they were a stop. This line is the third thing, so the
 * cases that matter are the ones where it could quietly go missing: a code this build has never
 * heard of (a newer server), an empty list, and a language that shipped without the words.
 */
describe("the turn's warnings", () => {
  it("says a known warning in the app's own words", () => {
    renderWithProviders(
      <NoticeList items={[{ code: "steps_low", text: "server wording that must not win" }]} />,
    );

    expect(screen.getByText("2 steps left before this turn stops")).toBeInTheDocument();
    expect(screen.queryByText("server wording that must not win")).not.toBeInTheDocument();
  });

  it("still tells a warning this build does not know, with the server's words", () => {
    renderWithProviders(<NoticeList items={[{ code: "from_the_future", text: "something new" }]} />);

    expect(screen.getByText("something new")).toBeInTheDocument();
  });

  it("renders nothing when there is nothing to say", () => {
    const { container } = renderWithProviders(<NoticeList items={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("has the three known warnings in every language the app offers", () => {
    for (const lang of LANGS) {
      for (const key of ["code.notice.stepsLow", "code.notice.compacted", "code.notice.toolLoopWarn"]) {
        expect(DICTS[lang.code][key], `${lang.code} is missing ${key}`).toBeTruthy();
      }
    }
  });
});
