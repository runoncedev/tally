import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "./mocks/node";
import { TransactionForm } from "../components/TransactionForm";
import { HouseholdContext } from "../lib/household";
import type { Category } from "../lib/collections";

const testHousehold = { id: "test-household-id", name: "Test Household" };

const categories: Category[] = [
  { id: 1, name: "Salary", type: "income", created_at: "", household_id: null },
  { id: 2, name: "Food", type: "expense", created_at: "", household_id: null },
];

const categoriesById = Object.fromEntries(categories.map((c) => [c.id, c]));

describe("TransactionForm", () => {
  it("inserta una transaction al completar el form y hacer submit", async () => {
    let insertedBody: unknown = null;

    server.use(
      http.post(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/transactions`,
        async ({ request }) => {
          insertedBody = await request.json();
          return HttpResponse.json({}, { status: 201 });
        },
      ),
    );

    const user = userEvent.setup();

    const publicId = crypto.randomUUID();

    render(
      <HouseholdContext.Provider value={testHousehold}>
        <TransactionForm
          categories={categories}
          month="2026-04"
          categoriesById={categoriesById}
          initialType="expense"
          publicId={publicId}
        />
      </HouseholdContext.Provider>,
    );

    await user.type(screen.getByPlaceholderText("0"), "50");
    await user.type(screen.getByPlaceholderText("Category"), "Food");
    await user.click(await screen.findByRole("option", { name: "Food" }));
    await user.click(screen.getByRole("button", { name: /add/i }));

    await waitFor(() => {
      expect(insertedBody).toMatchObject([
        {
          amount: -50,
          category_id: 2,
          public_id: publicId,
        },
      ]);
    });
  });
});
