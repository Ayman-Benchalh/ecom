# RAYANA — Security Architecture & Compliance Checklist

## 1. Security Architecture Principles

Security is implemented as a core architectural requirement in **RAYANA**, adhering to the OWASP Top 10 Web Application Security and OWASP API Security standards.

---

## 2. OWASP Top 10 Security Checklist & Controls

| Vulnerability Category | Mitigation in RAYANA | Status |
| :--- | :--- | :--- |
| **A01: Broken Access Control** | • No customer accounts exist; customer orders are looked up strictly using cryptographic order number + normalized phone combination.<br>• All Admin routes and server actions enforce `requireAdmin()` session validation.<br>• Admin session stored in HTTP-only, SameSite=Lax, Secure cookie.<br>• Review submission strictly verified via 192-bit cryptographic, time-limited, order-bound invitation tokens. | **VERIFIED** |
| **A02: Cryptographic Failures** | • Passwords hashed with `bcryptjs` using 12 salt rounds.<br>• Cryptographic session tokens generated via `crypto.randomBytes(32)`.<br>• Caddy enforces HTTPS with TLS 1.3 and HSTS headers (`max-age=31536000`). | **VERIFIED** |
| **A03: Injection (SQL / NoSQL)** | • Drizzle ORM uses parameterized SQL queries exclusively.<br>• Zero string concatenation in database queries.<br>• Client input validated with strict Zod schemas. | **VERIFIED** |
| **A04: Insecure Design** | • Authoritative price calculation: The frontend never controls the final order price; prices and totals are calculated strictly on the server.<br>• Anti-overselling: Stock deductions executed in atomic PostgreSQL transactions with ledger auditing. | **VERIFIED** |
| **A05: Security Misconfiguration** | • Caddy strips internal headers and provides `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`.<br>• PostgreSQL container is bound to internal Docker network only; not exposed publicly to the internet. | **VERIFIED** |
| **A06: Vulnerable & Outdated Components** | • Minimal modular dependency tree.<br>• Built with Next.js App Router and standalone output with non-root Docker user (`nextjs:nodejs`). | **VERIFIED** |
| **A07: Identification & Authentication Failures** | • Brute-force protection: Admin login locks account for 15 minutes after 5 consecutive failed attempts.<br>• Comprehensive audit logging of login attempts with IP attribution. | **VERIFIED** |
| **A08: Software & Data Integrity Failures** | • Section-based builder stores validated JSON configuration without evaluating arbitrary scripts or dangerous HTML. | **VERIFIED** |
| **A09: Security Logging & Monitoring** | • Persistent `audit_logs` table records admin events, authentication attempts, status modifications, and cancellations.<br>• `order_events` table preserves immutable event history for every order. | **VERIFIED** |
| **A10: Server-Side Request Forgery (SSRF)** | • Carrier tracking links utilize predefined safe URL templates (`https://carrier.ma/track/{tracking_number}`) without outbound fetching of arbitrary URLs. | **VERIFIED** |

---

## 3. Moroccan Data Minimization & Privacy Protection

- **No Public Customer Data Leaks:** Customer phone numbers and addresses are strictly excluded from public storefront APIs.
- **Normalized Moroccan Numbers:** Validated to canonical E.164 (`+212XXXXXXXXX`) while supporting standard local Moroccan inputs (`06...`, `07...`, `05...`).
- **No Unsolicited Tracking:** Meta Pixel and analytics scripts are configurable with customer consent options.

