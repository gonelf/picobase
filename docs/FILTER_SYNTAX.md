# PicoBase Filter Syntax Reference

PicoBase uses PocketBase's filter language for querying records. This is **not
SQL** — it's a simpler syntax designed for URL-safe queries.

Copy-paste any of these examples into your code.

---

## Table of Contents

1. [Basic Comparison](#basic-comparison)
2. [String Matching](#string-matching)
3. [Numbers](#numbers)
4. [Booleans](#booleans)
5. [Dates and Times](#dates-and-times)
6. [Null Checks](#null-checks)
7. [Logic Operators](#logic-operators)
8. [Relations (Dot Notation)](#relations-dot-notation)
9. [Array / Multi-value Fields](#array--multi-value-fields)
10. [Sorting](#sorting)
11. [Expanding Relations](#expanding-relations)
12. [Selecting Fields](#selecting-fields)
13. [Pagination](#pagination)
14. [Complete Examples](#complete-examples)

---

## Basic Comparison

| Operator | Meaning |
|----------|---------|
| `=`  | Equal |
| `!=` | Not equal |
| `>`  | Greater than |
| `>=` | Greater than or equal |
| `<`  | Less than |
| `<=` | Less than or equal |

```typescript
// Exact match
await pb.collection('users').getList(1, 20, {
  filter: 'role = "admin"',
})

// Not equal
await pb.collection('orders').getList(1, 20, {
  filter: 'status != "cancelled"',
})
```

---

## String Matching

| Operator | Meaning |
|----------|---------|
| `~`  | Contains (case-insensitive) |
| `!~` | Does not contain (case-insensitive) |

```typescript
// Name contains "john" (case-insensitive)
await pb.collection('users').getList(1, 20, {
  filter: 'name ~ "john"',
})

// Email does not contain "spam"
await pb.collection('users').getList(1, 20, {
  filter: 'email !~ "spam"',
})

// Title starts with a value (use contains — no startsWith operator)
await pb.collection('posts').getList(1, 20, {
  filter: 'title ~ "Breaking"',
})
```

---

## Numbers

```typescript
// Greater than
await pb.collection('products').getList(1, 20, {
  filter: 'price > 100',
})

// Range (between 10 and 50)
await pb.collection('products').getList(1, 20, {
  filter: 'price >= 10 && price <= 50',
})

// Exact number
await pb.collection('orders').getList(1, 20, {
  filter: 'quantity = 0',
})
```

---

## Booleans

```typescript
// Published posts
await pb.collection('posts').getList(1, 20, {
  filter: 'published = true',
})

// Unpublished drafts
await pb.collection('posts').getList(1, 20, {
  filter: 'published = false',
})
```

---

## Dates and Times

Dates must be quoted strings in `YYYY-MM-DD HH:MM:SS` format. Use `@now` for
the current server time.

```typescript
// Created after a specific date
await pb.collection('posts').getList(1, 20, {
  filter: 'created > "2024-01-01 00:00:00"',
})

// Created in the last 7 days
await pb.collection('posts').getList(1, 20, {
  filter: 'created >= @now - 7d',
})

// Created in the last 24 hours
await pb.collection('logs').getList(1, 100, {
  filter: 'created >= @now - 24h',
})

// Updated today
await pb.collection('tasks').getList(1, 50, {
  filter: 'updated >= @todayStart',
})

// Between two dates
await pb.collection('events').getList(1, 20, {
  filter: 'date >= "2024-06-01" && date <= "2024-06-30"',
})
```

**Date macros:**

| Macro | Meaning |
|-------|---------|
| `@now` | Current server timestamp |
| `@todayStart` | Start of today (00:00:00) |
| `@todayEnd` | End of today (23:59:59) |
| `@monthStart` | Start of current month |
| `@monthEnd` | End of current month |
| `@yearStart` | Start of current year |
| `@yearEnd` | End of current year |

**Duration suffixes** (used with `@now`):

| Suffix | Meaning |
|--------|---------|
| `d` | Days |
| `h` | Hours |
| `m` | Minutes |
| `s` | Seconds |

---

## Null Checks

```typescript
// Records where avatar is not set
await pb.collection('users').getList(1, 20, {
  filter: 'avatar = ""',
})

// Records where avatar is set
await pb.collection('users').getList(1, 20, {
  filter: 'avatar != ""',
})

// Null relation field
await pb.collection('posts').getList(1, 20, {
  filter: 'category = ""',
})
```

---

## Logic Operators

| Operator | Meaning |
|----------|---------|
| `&&` | AND |
| `\|\|` | OR |

Use parentheses `()` to group conditions.

```typescript
// AND — both conditions must be true
await pb.collection('posts').getList(1, 20, {
  filter: 'published = true && author = "john"',
})

// OR — either condition
await pb.collection('tasks').getList(1, 20, {
  filter: 'status = "active" || status = "pending"',
})

// Grouped conditions
await pb.collection('posts').getList(1, 20, {
  filter: 'published = true && (category = "news" || category = "tech")',
})

// Complex query
await pb.collection('orders').getList(1, 50, {
  filter: 'total > 100 && status != "cancelled" && created >= @now - 30d',
})
```

---

## Relations (Dot Notation)

Access fields on related records using dot notation.

```typescript
// Posts by a specific author name
await pb.collection('posts').getList(1, 20, {
  filter: 'author.name = "John"',
})

// Posts by verified authors
await pb.collection('posts').getList(1, 20, {
  filter: 'author.verified = true',
})

// Nested relations (author -> organization)
await pb.collection('posts').getList(1, 20, {
  filter: 'author.organization.name = "Acme"',
})
```

---

## Array / Multi-value Fields

For select fields with multiple values or relation fields with multiple records:

| Operator | Meaning |
|----------|---------|
| `?=` | Any value equals |
| `?!=` | Any value not equals |
| `?>` | Any value greater than |
| `?>=` | Any value greater than or equal |
| `?<` | Any value less than |
| `?<=` | Any value less than or equal |
| `?~` | Any value contains |
| `?!~` | Any value does not contain |

```typescript
// Posts tagged with "featured"
await pb.collection('posts').getList(1, 20, {
  filter: 'tags ?= "featured"',
})

// Posts with any tag containing "tech"
await pb.collection('posts').getList(1, 20, {
  filter: 'tags ?~ "tech"',
})

// Orders with any item priced over 50
await pb.collection('orders').getList(1, 20, {
  filter: 'items.price ?> 50',
})
```

---

## Sorting

Use the `sort` option. Prefix with `-` for descending, `+` (or no prefix) for
ascending.

```typescript
// Newest first
await pb.collection('posts').getList(1, 20, {
  sort: '-created',
})

// Alphabetical by title
await pb.collection('posts').getList(1, 20, {
  sort: 'title',
})

// Ascending (explicit + prefix)
await pb.collection('posts').getList(1, 20, {
  sort: '+title',
})

// Multi-field sort: newest first, then alphabetical by title
await pb.collection('posts').getList(1, 20, {
  sort: '-created,title',
})

// Sort by related field
await pb.collection('posts').getList(1, 20, {
  sort: '-author.name',
})
```

---

## Expanding Relations

Use `expand` to load related records in a single request instead of making
separate queries.

```typescript
// Load the author record with each post
const result = await pb.collection('posts').getList(1, 20, {
  expand: 'author',
})
console.log(result.items[0].expand?.author.name)

// Load multiple relations
const result = await pb.collection('posts').getList(1, 20, {
  expand: 'author,category',
})

// Nested expand (author and author's organization)
const result = await pb.collection('posts').getList(1, 20, {
  expand: 'author,author.organization',
})

// Expand works with getOne too
const post = await pb.collection('posts').getOne('RECORD_ID', {
  expand: 'author,comments',
})
```

---

## Selecting Fields

Use `fields` to return only specific fields (reduces payload size).

```typescript
// Only return id and title
const result = await pb.collection('posts').getList(1, 20, {
  fields: 'id,title',
})

// Include expanded relation fields
const result = await pb.collection('posts').getList(1, 20, {
  expand: 'author',
  fields: 'id,title,expand.author.name',
})
```

---

## Pagination

```typescript
// Page 1, 20 items per page
const page1 = await pb.collection('posts').getList(1, 20, {
  filter: 'published = true',
  sort: '-created',
})
console.log(page1.items)      // records for this page
console.log(page1.totalItems) // total matching records
console.log(page1.totalPages) // total pages

// Page 2
const page2 = await pb.collection('posts').getList(2, 20, {
  filter: 'published = true',
  sort: '-created',
})

// Get ALL records (auto-paginated, use with caution on large collections)
const allPosts = await pb.collection('posts').getFullList({
  filter: 'published = true',
  sort: '-created',
})

// Get first matching record
const latest = await pb.collection('posts').getFirstListItem(
  'published = true',
  { sort: '-created' }
)

// Skip total count for faster queries (when you don't need totalItems)
const result = await pb.collection('posts').getList(1, 20, {
  filter: 'published = true',
  skipTotal: true,
})
```

---

## Complete Examples

### Blog — published posts with author info

```typescript
const posts = await pb.collection('posts').getList(1, 10, {
  filter: 'published = true && created >= @now - 30d',
  sort: '-created',
  expand: 'author',
  fields: 'id,title,content,created,expand.author.name,expand.author.avatar',
})
```

### E-commerce — search products

```typescript
const products = await pb.collection('products').getList(1, 20, {
  filter: 'name ~ "laptop" && price >= 500 && price <= 2000 && inStock = true',
  sort: 'price',
  fields: 'id,name,price,image,rating',
})
```

### Task manager — user's active tasks

```typescript
const tasks = await pb.collection('tasks').getList(1, 50, {
  filter: `assignee = "${userId}" && status != "done" && dueDate <= @now + 7d`,
  sort: 'dueDate',
  expand: 'project',
})
```

### Chat — recent messages in a room

```typescript
const messages = await pb.collection('messages').getList(1, 50, {
  filter: `room = "${roomId}" && created >= @now - 24h`,
  sort: '-created',
  expand: 'sender',
})
```

### Admin — search users

```typescript
const users = await pb.collection('users').getList(1, 20, {
  filter: 'name ~ "john" || email ~ "john"',
  sort: '-created',
  fields: 'id,name,email,avatar,created,verified',
})
```

---

## Operator Quick Reference

| Operator | Meaning | Example |
|----------|---------|---------|
| `=` | Equal | `status = "active"` |
| `!=` | Not equal | `role != "guest"` |
| `>` | Greater than | `price > 100` |
| `>=` | Greater or equal | `age >= 18` |
| `<` | Less than | `stock < 10` |
| `<=` | Less or equal | `rating <= 5` |
| `~` | Contains | `name ~ "john"` |
| `!~` | Not contains | `email !~ "spam"` |
| `?=` | Any equals | `tags ?= "featured"` |
| `?~` | Any contains | `tags ?~ "tech"` |
| `&&` | AND | `a = true && b = true` |
| `\|\|` | OR | `a = true \|\| b = true` |
| `@now` | Server time | `created >= @now - 7d` |
