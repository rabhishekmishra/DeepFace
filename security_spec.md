# Security Specification - Visionary Biometric Audit

## 1. Data Invariants
- An analysis record (`analyses`) MUST belong to a valid user.
- A user CANNOT access or delete another user's records.
- Records are immutable except for deletion.
- Documentation IDs must be valid alphanumeric strings.

## 2. The "Dirty Dozen" Payloads

### Identity Spoofing
1. `{"userId": "victim_uid", "imageUrl": "...", ...}` -> Denied (User attempts to save analysis for another account)
2. `GET /analyses/victim_record` -> Denied (User attempts to read another account's history)

### Integrity / Resource Poisoning
3. `{"analysisId": "v" * 2000}` -> Denied (Large ID string via isValidId)
4. `{"imageUrl": "v" * 2000000}` -> Denied (Payload exceeding 1MB limit)
5. `{"createdAt": "2000-01-01T00:00:00Z"}` -> Denied (Client-provided timestamp vs server time)

### Operation Gaps
6. `DELETE /analyses/victim_record` -> Denied (User attempts to delete record they don't own)
7. `UPDATE /analyses/my_record` -> Denied (Records are intended to be immutable audit logs)

### PII Leaks
8. `LIST /analyses` -> Denied (Implicitly restricted by list query enforce blocks)

## 3. Test Runner (Conceptual)
Verifies that all unauthorized writes and cross-account reads return PERMISSION_DENIED.
