import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ActionAlertDialog from "./ActionAlertDialog";

describe("ActionAlertDialog", () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = vi.fn(function showModal(
      this: HTMLDialogElement,
    ) {
      this.open = true;
    });
    HTMLDialogElement.prototype.close = vi.fn(function close(this: HTMLDialogElement) {
      this.open = false;
    });
  });

  it("renders message and opens dialog when message is set", () => {
    render(<ActionAlertDialog message="V tomto termíne už máš potvrdené iné fotenie." />);

    expect(
      screen.getByText("V tomto termíne už máš potvrdené iné fotenie."),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: "OK" })).toBeDefined();
  });

  it("renders nothing when message is null", () => {
    const { container } = render(<ActionAlertDialog message={null} />);
    expect(container.firstChild).toBeNull();
  });
});
