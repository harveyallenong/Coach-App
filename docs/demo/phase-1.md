# Phase 1 demo: Foundation

Use these steps to check Phase 1 by hand. Start from a fresh database:

```bash
pnpm db:up && pnpm db:reset && pnpm dev
```

Sign-in emails go to Mailpit at http://localhost:8025. Use a phone-sized browser window (about 390 px wide) to check the mobile layout.

## 1. Sign in as a coach with a magic link
1. Open http://localhost:3000 and choose **Sign in**.
2. Enter `coach.ana@coachbook.local`. You should land on **Check your email**.
3. In Mailpit, open the email and click the link. You should land on `/coach`, showing **Hi, Ana Reyes**, 5 active clients and 1 pending invite.
4. On a phone-width window the navigation is at the bottom. On desktop it's in the header.

## 2. Edit the coach profile
1. Go to **Profile**, change the headline and add a certification line.
2. Click **Save profile**. A "Profile saved" toast appears. Reload the page and check the values stuck.
3. Turn on **List me in the CoachBook marketplace** and save. The marketplace itself comes in Phase 7.

## 3. Invite a client
1. Go to **Clients**, enter an email (optional) and click **Create invite link**.
2. Click **Copy link**. The new invite shows as "Invite pending" with **Copy link** and **Revoke**.
3. Click **Revoke** on an invite and confirm. It disappears from the list.

## 4. Accept an invite as a new user
1. In a private window, open http://localhost:3000/invite/seed-invite-ana-0000000000000000. You're redirected to sign in, with a `callbackUrl` back to the invite.
2. Sign in with a new email, for example `you@example.com`. You return to **Train with Ana Reyes**.
3. Click **Accept invite**. You land on `/me` and Ana is listed under **Your coaches**.
4. Open the same invite link again. It says *"already used or revoked"* (or *not found*).
5. Back in Ana's window, **Clients** now lists the new client as Active.

## 5. One account, both roles
1. As the new user, open the account menu (person icon) and choose **Become a coach**.
2. Fill in the form and click **Create coach profile**. You land on `/coach`.
3. The account menu now offers both **Coach view** and **Client view**.

## 6. Account settings
1. Open the account menu and choose **Account settings**. Change your name, phone (e.g. `+63 917 123 4567`) and time zone, then save.
2. Enter letters in the phone field. You should see an inline error.

## 7. Admin
1. Sign in as `admin@coachbook.local` and open `/admin`.
2. Search for the user you created and click **Suspend**, then confirm.
3. In that user's window, reload any page. They're signed out because their sessions were revoked.
4. Try to sign in again as that user. You'll see *"This account can't sign in."*
5. As a non-admin (e.g. Ana), open `/admin`. You get **Page not found**.

## 8. Permission checks (automated)
`pnpm test:int` covers these:
- Coach B can't read or edit coach A's profile, list A's clients, or archive A's client links.
- A coach whose link is only INVITED or ARCHIVED can't access that client's data.
- Non-admins can't call admin services. Admins can't suspend themselves.
- An invite email restriction, reuse of an invite, a coach accepting their own invite, and two concurrent acceptances (only one wins).

## 9. Double-booking constraint (automated)
`tests/integration/booking-constraint.int.test.ts`. The booking UI arrives in Phase 2; this checks the database layer.
- Overlapping appointments for one coach are rejected (SQLSTATE `23P01`).
- With 5 + 5 min buffers, back-to-back sessions need a 10-minute gap.
- Cancelled appointments don't block the slot, and other coaches aren't affected.
- 8 concurrent inserts for the same slot: exactly 1 succeeds.
