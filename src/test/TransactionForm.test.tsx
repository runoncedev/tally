import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransactionForm } from "../components/TransactionForm";
import type { Category } from "../lib/collections";

const categories: Category[] = [
  { id: 1, name: "Salary", type: "income", created_at: "", household_id: null },
  { id: 2, name: "Food", type: "expense", created_at: "", household_id: null },
];

const categoriesById = Object.fromEntries(categories.map((c) => [c.id, c]));

describe("TransactionForm", () => {
  it("llama onSubmit con el payload correcto al completar el form", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    const publicId = crypto.randomUUID();

    render(
      <TransactionForm
        categories={categories}
        month="2026-04"
        categoriesById={categoriesById}
        initialType="expense"
        publicId={publicId}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByPlaceholderText("0"), "50");
    await user.type(screen.getByPlaceholderText("Category"), "Food");
    await user.click(await screen.findByRole("option", { name: "Food" }));
    await user.click(screen.getByRole("button", { name: /add/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: -50,
        category_id: 2,
        public_id: publicId,
      }),
    );
  });
});
