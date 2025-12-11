[![npm version](https://img.shields.io/npm/v/@itrocks/former-name?logo=npm)](https://www.npmjs.org/package/@itrocks/former-name)
[![npm downloads](https://img.shields.io/npm/dm/@itrocks/former-name)](https://www.npmjs.org/package/@itrocks/former-name)
[![GitHub](https://img.shields.io/github/last-commit/itrocks-ts/former-name?color=2dba4e&label=commit&logo=github)](https://github.com/itrocks-ts/former-name)
[![issues](https://img.shields.io/github/issues/itrocks-ts/former-name)](https://github.com/itrocks-ts/former-name/issues)
[![discord](https://img.shields.io/discord/1314141024020467782?color=7289da&label=discord&logo=discord&logoColor=white)](https://25.re/ditr)

# former-name

Stores previous property names to help manage schema changes, legacy data access, and so on.

*This documentation was written by an artificial intelligence and may contain errors or approximations.
It has not yet been fully reviewed by a human. If anything seems unclear or incomplete,
please feel free to contact the author of this package.*

## Installation

```bash
npm i @itrocks/former-name
```

## Usage

`@itrocks/former-name` allows you to associate one or more previous names
with a property. This is useful when you rename properties in your domain
models but still need to:

- read legacy data that uses the old names,
- generate database or API schemas that mention both current and former
  column/field names,
- keep backward‑compatible mappings while you progressively migrate
  external systems.

It provides a property decorator `@FormerName()` to declare the list of
past names, and a helper function `formerNameOf()` to retrieve those
names at runtime.

### Minimal example

```ts
import { FormerName } from '@itrocks/former-name'

class User {
  @FormerName('mail', 'email_address')
  email = ''
}
```

In this example, the `email` property is declared as having previously
been called `mail` and `email_address`. Other components can then use
this information to transparently read legacy data or generate migration
scripts.

### Complete example with schema mapping

In a typical application this package is used together with
`@itrocks/reflect-to-schema` (or similar tooling) to keep track of
column names when models evolve.

```ts
import type { ObjectOrType }         from '@itrocks/class-type'
import { FormerName, formerNameOf }  from '@itrocks/former-name'

class Customer {
  // Property was originally named "name"
  @FormerName('name')
  fullName = ''

  // Never renamed
  email = ''
}

type LegacyRecord = {
  name?: string
  fullName?: string
  email?: string
}

/**
 * Load a Customer instance from a legacy record where some fields may
 * still use former property names.
 */
function loadCustomerFromLegacy(record: LegacyRecord): Customer {
  const customer = new Customer()

  customer.fullName =
    record.fullName
    ?? record.name
    ?? ''

  customer.email = record.email ?? ''

  return customer
}

/**
 * Example: generic helper using `formerNameOf()` to expose all
 * recognized names for a property.
 */
function getAllKnownNames<T extends object>(
  type: ObjectOrType<T>,
  property: keyof T
): string[] {
  const current = String(property)
  const former  = formerNameOf(type, property)
  return [current, ...former]
}

// [ 'fullName', 'name' ]
const names = getAllKnownNames(Customer, 'fullName')
```

In real‑world projects you usually let higher‑level helpers
(`@itrocks/reflect-to-schema`, custom mappers, etc.) use
`formerNameOf()` to build queries, schemas, or migrations, instead of
calling it manually everywhere.

## API

### `function FormerName<T extends object>(...formerName: string[]): DecorateCaller<T>`

Property decorator that records one or more former names for a
property.

#### Parameters

- `...formerName` – list of previous names for the property. The order
  is kept as provided and usually reflects the evolution history (from
  oldest to newest, ending with the current property name that is *not*
  included in this list).

#### Return value

- `DecorateCaller<T>` – function from `@itrocks/decorator/property`
  used internally by TypeScript to apply the decorator on the target
  property. You normally do not call this directly; you just apply
  `@FormerName('oldName')` over the property.

#### Example

```ts
class Product {
  @FormerName('price_ht', 'priceExclTax')
  unitPrice = 0
}
```

---

### `function formerNameOf<T extends object>(target: ObjectOrType<T>, property: KeyOf<T>): string[]`

Returns the list of former names registered for a given property.

#### Parameters

- `target` – the class (constructor) or instance that owns the property
  you want to inspect.
- `property` – the property key whose former names you want to read.

#### Return value

- `string[]` – array of former names. If the property has never been
  decorated with `@FormerName()`, this returns an empty array.

#### Example

```ts
import type { ObjectOrType }        from '@itrocks/class-type'
import { FormerName, formerNameOf } from '@itrocks/former-name'

class Account {
  @FormerName('login', 'user')
  username = ''
}

function toAllFieldNames<T extends object>(
  type: ObjectOrType<T>,
  property: keyof T
): string[] {
  return [String(property), ...formerNameOf(type, property)]
}

// [ 'username', 'login', 'user' ]
const allUserNames = toAllFieldNames(Account, 'username')
```

## Typical use cases

- Keep backward‑compatible mappings between your domain models and
  legacy database or API field names when performing refactors.
- Support zero‑downtime or progressive migrations: systems can accept
  both the new property name and one or more previous names during a
  transition period.
- Generate schemas (database, JSON, OpenAPI, etc.) that explicitly list
  former names for documentation or compatibility purposes.
- Implement import/export logic able to understand older versions of
  your data structures by checking `formerNameOf()`.
- Centralize the history of model property names directly on the
  properties themselves, rather than scattering conversion logic across
  the codebase.
