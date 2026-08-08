# SpendPilot Database Schema Reference

SpendPilot utilizes a normalized relational data model across 12 primary entity collections:

---

## 1. `users`
- `id` (PK, String): Unique user UUID.
- `name` (String): Full display name.
- `email` (String, Unique): Registered email address.
- `password_hash` (String): Bcrypt hashed password.
- `avatar_url` (String, Optional): Path to user avatar image.
- `is_verified` (Integer): Verification status flag (0 or 1).

## 2. `user_preferences`
- `user_id` (PK/FK): Reference to `users.id`.
- `currency` (String): Preferred currency symbol (`₹`, `$`, `€`, `£`).
- `theme` (String): Theme preference (`dark` or `light`).
- `default_split_mode` (String): Default split mode (`EQUAL`, `PERCENTAGE`, `EXACT`).

## 3. `sessions`
- `id` (PK, String): Session UUID.
- `user_id` (FK): Reference to `users.id`.
- `token_hash` (String): Hash of active session token.
- `is_revoked` (Integer): Revocation flag (0 or 1).

## 4. `groups`
- `id` (PK, String): Group UUID.
- `name` (String): Group title.
- `group_type` (String): Category preset (`Trip`, `Roommates`, `Office`, `Family`, etc.).
- `created_by` (FK): Reference to `users.id`.

## 5. `group_members`
- `id` (PK, String): Membership record ID.
- `group_id` (FK): Reference to `groups.id`.
- `user_id` (FK): Reference to `users.id`.
- `role` (String): Member role (`ADMIN` or `MEMBER`).

## 6. `personal_expenses`
- `id` (PK, String): Expense UUID.
- `user_id` (FK): Reference to `users.id`.
- `amount` (Real): Expense monetary amount.
- `category` (String): Expense category.
- `description` (String): Expense note.
- `payment_method` (String): Payment method used (`UPI`, `Cash`, `Credit Card`, `Debit Card`, `Net Banking`).

## 7. `group_expenses`
- `id` (PK, String): Group expense UUID.
- `group_id` (FK): Reference to `groups.id`.
- `paid_by_id` (FK): Reference to `users.id` who paid.
- `amount` (Real): Total bill amount.
- `split_type` (String): Split strategy (`EQUAL`, `PERCENTAGE`, `EXACT`).

## 8. `expense_splits`
- `id` (PK, String): Split record ID.
- `expense_id` (FK): Reference to `group_expenses.id`.
- `user_id` (FK): Reference to debtor `users.id`.
- `amount_owed` (Real): Calculated monetary debt amount.
- `percentage` (Real, Optional): Percentage share.

## 9. `settlements`
- `id` (PK, String): Settlement ledger ID.
- `group_id` (FK): Reference to `groups.id`.
- `payer_id` (FK): Reference to paying `users.id`.
- `payee_id` (FK): Reference to receiving `users.id`.
- `amount` (Real): Settled amount.
- `status` (String): Status (`PENDING` or `SETTLED`).
