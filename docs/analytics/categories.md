# Categories

Credo Statement Analyzer automatically categorizes expense transactions using a rule-based system of 91 regex patterns.

### How Categorization Works

For each transaction, the text `operation + " " + description` is tested against an ordered list of regex rules. The **first matching rule** determines the category.

```
Input:  "გადახდა - SPAR 18.39 GEL 31.07.2025"
Match:  /SPAR/i → Grocery
Result: { name: "Grocery", icon: "🛒" }
```

If no rule matches, the transaction is categorized as **Other** (📦).

#### Performance

Categorization results are cached using a `WeakMap` keyed by the transaction object reference. Since categorization is called multiple times per transaction (in summaries, charts, tables, insights), the cache eliminates redundant regex matching — typically saving 250,000+ regex tests for a dataset of 500 transactions.

### Category List

#### Grocery (🛒)

| Pattern | Matches |
|---------|---------|
| `/SPAR/i` | SPAR supermarkets |
| `/DAILY\|DEILY/i` | Daily convenience stores |
| `/GOODWILL/i` | Goodwill stores |
| `/CARREFOUR/i` | Carrefour hypermarkets |
| `/NIKORA/i` | Nikora chain |
| `/SMART/i` | Smart supermarkets |
| `/FRESCO/i` | Fresco stores |
| `/ORI NABIJI\|ორი ნაბიჯი/i` | Ori Nabiji chain |
| `/AGROHUB/i` | Agrohub stores |
| `/MAGNITI\|MAGNIT/i` | Magniti/Magnit stores |
| `/EURO ?PRODUCT/i` | Euro Product stores |
| `/UNIVERSAM/i` | Universam stores |

#### Food Delivery (🍔)

| Pattern | Matches |
|---------|---------|
| `/WOLT/i` | Wolt delivery |
| `/BOLT FOOD\|BOLT\.EU.*FOOD/i` | Bolt Food delivery |
| `/GLOVO/i` | Glovo delivery |

#### Restaurants & Cafes (🍽)

| Pattern | Matches |
|---------|---------|
| `/TAKARA/i` | Takara restaurant |
| `/MCDONALD/i` | McDonald's |
| `/KFC/i` | KFC |
| `/WENDY/i` | Wendy's |
| `/SUBWAY/i` | Subway |
| `/DUNKIN/i` | Dunkin' |
| `/STARBUCKS/i` | Starbucks |
| `/COFFEE/i` | Any coffee shop |

#### Pharmacy (💊)

| Pattern | Matches |
|---------|---------|
| `/AVERSI/i` | Aversi Pharmacy |
| `/GPC/i` | GPC Pharmacy |
| `/PSP/i` | PSP Pharmacy |
| `/PHARMADEPOT\|PHARMA ?DEPOT/i` | Pharma Depot |

#### Taxi (🚕)

| Pattern | Matches |
|---------|---------|
| `/YANDEX\|YANDEX\.GO/i` | Yandex.Go |
| `/BOLT(?!.*FOOD)/i` | Bolt (excludes Bolt Food) |
| `/MAXIM/i` | Maxim taxi |

!!! note "BOLT disambiguation"
    The Taxi rule uses a negative lookahead `(?!.*FOOD)` to avoid matching "BOLT FOOD" transactions, which should go to the Food Delivery category. Rule order matters — Food Delivery rules are checked before Taxi.

#### Transport (🚌)

| Pattern | Matches |
|---------|---------|
| `/INFOBUS/i` | Infobus tickets |
| `/METRO\|მეტრო/i` | Tbilisi Metro |
| `/RAILWAY\|რკინიგზა/i` | Georgian Railway |
| `/WIZZ ?AIR\|RYAN ?AIR\|PEGASUS\|TURKISH AIR/i` | Airlines |

#### Mobile & Internet (📱)

| Pattern | Matches |
|---------|---------|
| `/MAGTICOM\|მაგთი\|მობილური/i` | Magticom |
| `/SILKNET\|სილქნეტ/i` | Silknet |
| `/BEELINE\|GEOCELL/i` | Beeline/Geocell |

#### Utilities (🏠)

| Pattern | Matches |
|---------|---------|
| `/ელ\.ენერგია\|ეპ ჯორჯია\|დენის\|ENERGO/i` | Electricity |
| `/გაზი\|სოკარ\|SOCAR/i` | Gas (SOCAR) |
| `/წყალი\|წყალმომარაგ/i` | Water supply |
| `/TELASI/i` | Telasi electricity |

#### Shopping (🛍)

| Pattern | Matches |
|---------|---------|
| `/pogi shop/i` | Pogi Shop |
| `/ORGSERVICE/i` | Orgservice |
| `/3 t\.t\.t/i` | 3 T.T.T store |
| `/AMAZON\|ALIEXPRESS\|EBAY/i` | Online marketplaces |

#### Subscriptions (📺)

| Pattern | Matches |
|---------|---------|
| `/NETFLIX\|SPOTIFY\|YOUTUBE\|GOOGLE\|APPLE/i` | Digital subscriptions |

#### Bank Fees (🏦)

| Pattern | Matches |
|---------|---------|
| `/საკომისიო\|Cross Border Fee/i` | Bank commissions and cross-border fees |

#### Currency Exchange (💱)

| Pattern | Matches |
|---------|---------|
| `/კონვერტაცია\|Exchange\|Конвертация\|Обмен/i` | Currency exchange operations |

#### Self Transfer (🔄)

| Pattern | Matches |
|---------|---------|
| `/საკუთარ ანგარიშებს/i` | Transfers between own accounts |

#### Transfer to Others (💸)

| Pattern | Matches |
|---------|---------|
| `/გადარიცხვა.*კლიენტებს\|თანხის გადარიცხვა/i` | Outgoing transfers to other people |

#### Incoming Transfer (📥)

| Pattern | Matches |
|---------|---------|
| `/სხვა ბანკიდან\|Private transfers/i` | Incoming transfers from other banks |

#### Deposit (📥)

| Pattern | Matches |
|---------|---------|
| `/შეტანა\|ჩარიცხვა/i` | Cash deposits |
| `/ბარათზე.*ჩარიცხვა/i` | Card deposits |

#### Debt Collection (📋)

| Pattern | Matches |
|---------|---------|
| `/დავალიანების.*მოგროვება/i` | Debt collection charges |

#### Services (🔧)

| Pattern | Matches |
|---------|---------|
| `/P\/E\s\|ი\/მ\s/i` | Payments to individual entrepreneurs (IE) |

#### Other (📦)

Any transaction that doesn't match any of the above rules.

### Internal Transfer Detection

Two categories are treated as "internal transfers" and filtered out when the **Noise Filter** is active:

- **Currency Exchange** (💱)
- **Self Transfer** (🔄)

This prevents internal money movements from inflating income and expense totals.

### Merchant Name Extraction

When building category breakdowns and merchant lists, the app extracts a readable merchant name using these patterns (in order):

1. **Card payment**: `გადახდა - MERCHANT_NAME 18.39 GEL` → `MERCHANT_NAME`
2. **Utility payment**: `გაზი - სოკარ ჯორჯია გაზი - 003102794156` → `სოკარ ჯორჯია`
3. **Beneficiary name**: `transaction.beneficiaryName` if available
4. **Fallback**: `transaction.operation` or `transaction.description`
