# Security Specification: QualiPulse Firestore Security & Data Invariants

## 1. Data Invariants
1. **User Profile Ownership**: A user profile document `/users/{userId}` can only be created and updated by the user whose `request.auth.uid == userId`. Users cannot elevate their own role to 'admin' or alter immutable fields like `userId`.
2. **Strict User Interaction Isolation**: Every interaction under `/users/{userId}/interactions/{interactionId}` must have `userId == request.auth.uid`. A standard user cannot read, query, list, write, or delete another user's interactions under any circumstances.
3. **Super Admin Authorization**: The designated super administrator (`aasaali_250000003099@uic.edu.ph`) has verified administrative privileges to view company audit submissions across users and upload/manage company reference standards.
4. **Company Reference Standards**: Documents in `/company_standards/{standardId}` are readable by authenticated users (to provide the audit benchmark rubric), but can strictly only be created, modified, or deleted by the Super Admin.
5. **Admin Registry Integrity**: Documents in `/admins/{adminId}` are read-only to authenticated users for admin verification, and can only be modified by the Super Admin.
6. **No Blanket Reads**: All list queries are strictly evaluated against `resource.data.userId == request.auth.uid` for regular users or admin privileges.
7. **Size & Schema Enforcements**: Strings are strictly bound by `.size()` limits. Document IDs must be valid alphanumeric strings `^[a-zA-Z0-9_\\-]+$` up to 128 characters.
8. **Email Verification**: Privileged administrative writes mandate `request.auth.token.email_verified == true`.

---

## 2. The "Dirty Dozen" Malicious Payloads

1. **Payload 1 (Cross-User Read Snooping)**: User B attempts to read `/users/UserA/interactions/audit-101`. Expected: PERMISSION_DENIED.
2. **Payload 2 (Cross-User Write Injection)**: User B attempts to write a malicious record into `/users/UserA/interactions/audit-999`. Expected: PERMISSION_DENIED.
3. **Payload 3 (Self-Role Elevation)**: User A writes `{ "role": "admin" }` to `/users/UserA` attempting to grant themselves admin privileges. Expected: PERMISSION_DENIED.
4. **Payload 4 (Admin Email Spoofing with unverified email)**: Attacker authenticates with email `aasaali_250000003099@uic.edu.ph` but `email_verified: false` and tries to write to `/company_standards/sop-1`. Expected: PERMISSION_DENIED.
5. **Payload 5 (Unauthorized Company Standard Modification)**: Standard User A attempts to write or delete a company standard at `/company_standards/iso-9001`. Expected: PERMISSION_DENIED.
6. **Payload 6 (Oversized Payload / Denial of Wallet)**: User A attempts to send a 500KB string in `userInput` or 2000 character ID. Expected: PERMISSION_DENIED.
7. **Payload 7 (Path Variable Poisoning)**: User sends path with junk characters `../../bad` or 1KB long ID. Expected: PERMISSION_DENIED.
8. **Payload 8 (Shadow Field Injection)**: User A attempts to include unauthorized field `isApprovedByAuditor: true` in an interaction. Expected: PERMISSION_DENIED.
9. **Payload 9 (Unauthenticated Read)**: Unauthenticated visitor attempts to read `/users/UserA/interactions/audit-1`. Expected: PERMISSION_DENIED.
10. **Payload 10 (Admin Collection Takeover)**: Standard User A attempts to create an entry in `/admins/UserA`. Expected: PERMISSION_DENIED.
11. **Payload 11 (Interaction Owner Tampering)**: User A writes to `/users/UserA/interactions/audit-2` with `userId: "UserB"`. Expected: PERMISSION_DENIED.
12. **Payload 12 (Blanket List Scraping)**: Non-admin queries all users' interactions across the database via collection group. Expected: PERMISSION_DENIED.

---

## 3. Test Runner Specification
Tests simulate Firestore rule evaluation using `@firebase/rules-unit-testing` patterns to ensure every Dirty Dozen scenario is explicitly blocked with PERMISSION_DENIED.
