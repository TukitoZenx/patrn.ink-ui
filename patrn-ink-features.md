# patrn.ink — Feature Reference Guide

---

## 1. Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/google/login` | GET | Redirects to Google OAuth consent screen |
| `/auth/github/login` | GET | Redirects to GitHub OAuth consent screen |
| `/api/me` | GET | Returns current user profile |

**Auth Flow:**
1. User clicks login → redirected to provider (Google/GitHub)
2. Provider redirects back to API callback
3. API creates/updates user, generates JWT
4. API redirects to frontend: `{FRONTEND_URL}/auth/callback?token={JWT}`
5. Frontend stores JWT in localStorage, uses `Authorization: Bearer {token}` header

**User Model:**
```
{
  id:         string    // UUID
  email:      string
  name:       string
  picture:    string    // Avatar URL
  provider:   string    // "google" or "github"
  created_at: string    // ISO 8601
}
```

---

## 2. Link Management

### Create Link
**`POST /api/shorten`**

```json
{
  "long_url":         "https://example.com/very/long/url",  // Required
  "custom_code":      "my-link",          // Optional, 3-20 alphanumeric/hyphen
  "expires_in":       168,                // Optional, hours until expiration
  "scheduled_at":     "2026-04-01T...",   // Optional, ISO 8601 activation time
  "tags":             ["portfolio"],       // Optional, string array
  "password":         "secret123",        // Optional, will be bcrypt-hashed
  "title":            "My Portfolio",      // Optional
  "description":      "Personal site",    // Optional
  "age_verification": 0                   // Optional: 0=none, 1=13+, 2=18+, 3=21+
}
```

**Response:**
```json
{
  "short_url":   "https://patrn.ink/abc123",
  "short_code":  "abc123",
  "long_url":    "https://example.com/very/long/url",
  "qr_code_url": "https://patrn.ink/abc123/qr",
  "expires_at":  "2026-04-08T...",
  "scheduled_at": null,
  "tags":        ["portfolio"]
}
```

### List Links (Paginated)
**`GET /api/links`**

| Query Param | Type | Description |
|-------------|------|-------------|
| `search` | string | Search in short_code, long_url, title |
| `tags` | string[] | Filter by tags (repeat param) |
| `page` | int | Page number (default: 1) |
| `limit` | int | Items per page (default: 10) |
| `sort_by` | string | `created_at` or `clicks` |
| `sort_order` | string | `asc` or `desc` |
| `archived` | bool | Show only archived links |

**Response:**
```json
{
  "links":       [...],
  "total":       42,
  "page":        1,
  "limit":       10,
  "total_pages": 5
}
```

### Get Link Detail
**`GET /api/links/:code`**

### Update Link
**`PUT /api/links/:code`**

Accepts same fields as create (except `custom_code`), plus:
- `is_archived`: bool — soft archive/unarchive

### Delete Link
**`DELETE /api/links/:code`**

### Link Model
```
{
  short_code:       string
  long_url:         string
  user_id:          string
  custom_alias:     bool      // true if user chose the code
  clicks:           int       // total click count
  created_at:       string    // ISO 8601
  expires_at:       string?   // optional
  scheduled_at:     string?   // optional
  is_active:        bool
  is_archived:      bool
  tags:             string[]?
  password:         string?   // present = protected (hashed)
  title:            string?
  description:      string?
  age_verification: int       // 0=none, 1=13+, 2=18+, 3=21+
}
```

---

## 3. Analytics

### Get Analytics Summary
**`GET /api/analytics/:code`**

| Query Param | Type | Description |
|-------------|------|-------------|
| `start_date` | string | ISO date (YYYY-MM-DD) |
| `end_date` | string | ISO date (YYYY-MM-DD) |

**Response:**
```json
{
  "total_clicks":   1234,
  "unique_clicks":  890,
  "top_referrers":  { "google.com": 200, "twitter.com": 150 },
  "clicks_by_date": { "2026-03-20": 45, "2026-03-21": 62 },
  "clicks_by_hour": { "0": 5, "1": 3, ... "23": 12 },
  "device_types":   { "Desktop": 600, "Mobile": 500, "Tablet": 134 },
  "browser_types":  { "Chrome": 700, "Safari": 300, "Firefox": 234 },
  "countries":      { "US": 400, "UK": 200, "IN": 150 },
  "timeline":       [{ "date": "2026-03-20", "clicks": 45 }, ...]
}
```

### Export Analytics
**`GET /api/analytics/:code/export`**

| Query Param | Type | Values |
|-------------|------|--------|
| `format` | string | `csv` or `json` |
| `start_date` | string | ISO date |
| `end_date` | string | ISO date |

Returns downloadable file.

---

## 4. Bulk Operations

### Bulk Delete / Archive
**`POST /api/bulk/delete`**
```json
{
  "codes":   ["abc123", "xyz789"],
  "archive": true    // true = archive, false = permanent delete
}
```

**Response:**
```json
{
  "deleted": ["abc123", "xyz789"],
  "failed":  { "bad1": "not found" }   // optional
}
```

### Bulk Import
**`POST /api/bulk/import`**
```json
{
  "links": [
    { "long_url": "https://example.com", "custom_code": "ex", "tags": ["test"], "title": "Example" },
    { "long_url": "https://other.com" }
  ]
}
```

**Response:**
```json
{
  "created": [ { "short_url": "...", "short_code": "..." } ],
  "failed":  [ { "index": 1, "url": "...", "reason": "invalid URL" } ]
}
```

### Export All Links
**`GET /api/export/links?format=csv|json`**

---

## 5. API Tokens

### Create Token
**`POST /api/tokens`**
```json
{
  "name":       "My CLI Token",
  "scopes":     ["links:read", "links:write", "analytics:read", "bulk:read", "bulk:write"],
  "expires_in": 30    // Optional, days
}
```

**Response:**
```json
{
  "token": "ptk_abc123...full_token_shown_once",
  "api_token": {
    "id":           "uuid",
    "name":         "My CLI Token",
    "token_prefix": "ptk_abc1",
    "scopes":       ["links:read", "links:write"],
    "rate_limit":   60,
    "created_at":   "2026-03-24T...",
    "is_active":    true
  }
}
```

> **Important:** The full `token` value is only returned at creation. Store it immediately.

### List Tokens
**`GET /api/tokens`** → `{ tokens: APIToken[] }`

### Revoke Token
**`DELETE /api/tokens/:id`**

### Update Rate Limit
**`PUT /api/tokens/:id/rate-limit`**
```json
{ "rate_limit": 120 }
```

### Available Scopes
| Scope | Access |
|-------|--------|
| `links:read` | Read links |
| `links:write` | Create/update/delete links |
| `analytics:read` | View analytics |
| `bulk:read` | Export links |
| `bulk:write` | Bulk import/delete |

---

## 6. Public / Redirect Endpoints

### Redirect
**`GET /:code`**

If unprotected → HTTP 302 redirect to `long_url`

If protected → returns JSON:
```json
{ "password_required": true }
// or
{ "age_required": "18+", "age_level": 2 }
```

### Verify Password
**`POST /:code/verify`**
```json
{ "password": "user-entered-password" }
```
→ `{ "redirect_url": "https://..." }`

### Verify Age
**`POST /:code/verify-age`**
```json
{ "confirmed": true, "age_level": 2 }
```
→ `{ "redirect_url": "https://..." }`

### QR Code
**`GET /:code/qr`** → PNG image of QR code

### Link Preview (by code)
**`GET /:code/preview`**
```json
{
  "title":       "Page Title",
  "description": "Meta description",
  "image":       "https://og-image.jpg",
  "favicon":     "https://favicon.ico",
  "url":         "https://example.com",
  "domain":      "example.com"
}
```

### URL Preview (by raw URL)
**`GET /api/preview?url=https://example.com`**

Same response as above.

---

## 7. UI Pages to Implement

| Route | Purpose |
|-------|---------|
| `/` | Landing page with OAuth login |
| `/auth/callback` | Receives `?token=` from API, stores JWT, redirects to dashboard |
| `/dashboard` | Overview: stats cards, quick-create input, recent links |
| `/dashboard/links` | Links table with search, sort, filter, pagination, bulk select |
| `/dashboard/links/[code]` | Link detail: all metadata, QR code, inline analytics chart, edit/delete |
| `/dashboard/analytics` | Link selector + date range → timeline chart, device/browser pie charts, referrer bar chart, CSV/JSON export |
| `/dashboard/tokens` | Create token (name, scopes, expiry), list with prefix/scopes/status, revoke |
| `/dashboard/settings` | User profile display, theme toggle, sign out |
| `/[code]` | Public gate: password input form or age confirmation prompt |

---

## 8. Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Go, Gin framework |
| **Database** | AWS DynamoDB |
| **Cache** | Redis |
| **Frontend** | Next.js 16, TypeScript, Tailwind CSS v4 |
| **Auth** | OAuth 2.0 (Google, GitHub) + JWT |

---

*Generated from patrn.ink API source code analysis — March 2026*
