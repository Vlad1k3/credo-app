---
hide:
  - navigation
  - toc
---

<div class="hero" markdown>

# Credo Statement Analyzer

<p class="hero-subtitle">Privacy-first financial analytics for Credo Bank statements. All data stays in your browser.</p>

<div class="hero-buttons">
  <a href="introduction/" class="btn-primary">Get Started &#8594;</a>
  <a href="https://github.com/Vlad1k3/credo-app" target="_blank" class="btn-secondary">GitHub</a>
</div>

</div>

<div class="grid-cards" markdown>

<div class="grid-card" markdown>
<span class="grid-card-icon">&#x1F512;</span>
<span class="grid-card-title">100% Private</span>
<span class="grid-card-text">Your financial data never leaves your device. No server, no tracking, no accounts.</span>
</div>

<div class="grid-card" markdown>
<span class="grid-card-icon">&#x1F4C8;</span>
<span class="grid-card-title">Deep Analytics</span>
<span class="grid-card-text">Income/expense trends, categories, savings rates, balance timelines, period comparisons.</span>
</div>

<div class="grid-card" markdown>
<span class="grid-card-icon">&#x1F4B1;</span>
<span class="grid-card-title">Multi-Currency</span>
<span class="grid-card-text">Supports GEL, USD, EUR, RUB. Converts using historical NBG exchange rates.</span>
</div>

<div class="grid-card" markdown>
<span class="grid-card-icon">&#x1F4F1;</span>
<span class="grid-card-title">Mobile-Ready</span>
<span class="grid-card-text">Responsive design with touch-friendly controls and collapsible sections.</span>
</div>

</div>

## :material-rocket-launch: Quick Start

1. Export your statement from [Credo Bank](https://mycredo.ge) as `.xlsx` or `.pdf`
2. Open the app and drag your file(s) onto the upload area
3. Explore your financial data across All Time, Year, Month, Week, or Day views

## :material-cog: How It Works

```mermaid
flowchart LR
    A["Bank Statement<br/>.xlsx / .pdf / .csv"] --> B[Parser]
    B --> C["Categorizer<br/>91 regex rules"]
    C --> D[Analytics Engine]
    D --> E[Interactive Dashboard]
```

All steps run in the browser. The only network request is fetching exchange rates from the [National Bank of Georgia API](https://nbg.gov.ge) when multi-currency accounts are detected.
