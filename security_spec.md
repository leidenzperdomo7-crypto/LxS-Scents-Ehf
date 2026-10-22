# Security Specification - Zero-Trust Identity, Authentication & Order Integrity

## 1. Data Invariants
- **Cryptographic Authentication:** Identity is solely established by Firebase Auth (`request.auth.uid`). Client-side state, `localStorage`, or unverified client strings are strictly untrusted and have zero authority.
- **Admin Privilege Verification:** Admin role strictly requires `request.auth.uid == 'VempaKpo94cWuYAPH673GczZ6YX2'` OR `(request.auth.token.email == 'leidenzperdomo7@gmail.com' && request.auth.token.email_verified == true)`.
- **Worker/Staff Verification:** Worker role strictly requires `request.auth.uid == 'OTl3dDZpoKf8WrkDiFOnM8HFsBg1'` OR `(request.auth.token.email == 'staff.fulfillment@lxsscents.com' && request.auth.token.email_verified == true)`.
- **RBAC & Privilege Escalation Guard:** Regular users can NEVER self-assign or escalate roles (e.g., `membershipTier`, `isKloneMember`, `points`). On profile updates, users are constrained to non-privilege personal fields (`displayName`, `phone`, `address`, `apartment`, `cityZip`, `dob`, `avatarUrl`, `updatedAt`).
- **Order Immutability & Status Authority:** Once created, order data (`status`, `statusStep`, `carrier`, `trackingNumber`, `paymentStatus`, `total`) can ONLY be updated by verified staff or admins. Customers cannot modify existing orders.
- **Strict Data Isolation:** Each user can only access their own profile `/users/{userId}`, cart `/users/{userId}/cart/current`, files `/users/{userId}/files/{fileId}`, and orders `/users/{userId}/orders/{orderId}`. Unauthenticated users cannot read or write user data.

## 2. The Dirty Dozen Payloads (Mandatory Rejection Tests)
1. **Client Identity Spoofing:** Attacker sends write with forged UID `request.auth.uid = 'attacker'` into `/users/{victimId}` -> **PERMISSION_DENIED**.
2. **Unauthenticated Session Entry:** Unauthenticated client (`request.auth = null`) requesting `/users/{userId}` or `/orders` -> **PERMISSION_DENIED**.
3. **Email Spoofing Attack:** Attacker creates an account with `email: 'leidenzperdomo7@gmail.com'` but `email_verified: false`, attempting to list `/orders` or modify `/users` -> **PERMISSION_DENIED**.
4. **Self-Assigned VIP Escalation:** Regular authenticated user attempting to create profile with `isKloneMember: true` or `membershipTier: 'vip'` -> **PERMISSION_DENIED**.
5. **Unauthorized Role Modification on Update:** Regular authenticated user attempting an update modifying `points: 99999` or `isKloneMember: true` -> **PERMISSION_DENIED**.
6. **Customer Order Tampering:** Authenticated customer attempting to update their own order to `paymentStatus: 'paid'` or `status: 'delivered'` -> **PERMISSION_DENIED**.
7. **Order ID Poisoning:** Attempting to create order with 2KB string ID or malicious non-alphanumeric characters -> **PERMISSION_DENIED**.
8. **Cart Bounding & Denial of Wallet:** Writing a cart document with `items` list containing > 30 items or negative subtotal -> **PERMISSION_DENIED**.
9. **Order Cross-Owner Creation:** Authenticated user `uid123` attempting to create order with `incoming().userId = 'uid456'` -> **PERMISSION_DENIED**.
10. **Shadow Field Injection:** Attacker attempting to update user profile with unauthorized fields like `isAdmin: true` or `role: 'superadmin'` -> **PERMISSION_DENIED**.
11. **PII Directory Scraping:** Unauthenticated or regular user attempting to `list` all documents under `/users` -> **PERMISSION_DENIED**.
12. **Malicious Order Deletion:** Non-admin attempting to delete an order document from `/orders/{orderId}` or `/users/{userId}/orders/{orderId}` -> **PERMISSION_DENIED**.
