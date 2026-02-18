---
hide:
  - navigation
  - toc
---

<div class="hero" markdown>

# Анализатор выписок Credo

<p class="hero-subtitle">Финансовая аналитика с приоритетом конфиденциальности для выписок Credo Bank. Все данные остаются в вашем браузере.</p>

<div class="hero-buttons">
  <a href="introduction/" class="btn-primary">Начать &#8594;</a>
  <a href="https://github.com/Vlad1k3/credo-app" target="_blank" class="btn-secondary">GitHub</a>
</div>

</div>

<div class="grid-cards" markdown>

<div class="grid-card" markdown>
<span class="grid-card-icon">&#x1F512;</span>
<span class="grid-card-title">100% Приватно</span>
<span class="grid-card-text">Ваши финансовые данные никогда не покидают устройство. Без серверов, без трекинга, без аккаунтов.</span>
</div>

<div class="grid-card" markdown>
<span class="grid-card-icon">&#x1F4C8;</span>
<span class="grid-card-title">Глубокая аналитика</span>
<span class="grid-card-text">Тренды доходов/расходов, категории, нормы сбережений, хронология баланса, сравнение периодов.</span>
</div>

<div class="grid-card" markdown>
<span class="grid-card-icon">&#x1F4B1;</span>
<span class="grid-card-title">Мультивалютность</span>
<span class="grid-card-text">Поддержка GEL, USD, EUR, RUB. Конвертация по историческим курсам НБГ.</span>
</div>

<div class="grid-card" markdown>
<span class="grid-card-icon">&#x1F4F1;</span>
<span class="grid-card-title">Мобильная версия</span>
<span class="grid-card-text">Адаптивный дизайн с удобным сенсорным управлением и сворачиваемыми секциями.</span>
</div>

</div>

## :material-rocket-launch: Быстрый старт

1. Экспортируйте выписку из [Credo Bank](https://mycredo.ge) в формате `.xlsx` или `.pdf`
2. Откройте приложение и перетащите файл(ы) в зону загрузки
3. Исследуйте свои финансовые данные в режимах «За всё время», «Год», «Месяц», «Неделя» или «День»

## :material-cog: Как это работает

```mermaid
flowchart LR
    A["Банковская выписка<br/>.xlsx / .pdf / .csv"] --> B[Парсер]
    B --> C["Категоризатор<br/>91 regex-правило"]
    C --> D[Аналитика]
    D --> E[Интерактивная панель]
```

Все этапы выполняются в браузере. Единственный сетевой запрос — получение обменных курсов из [API Национального банка Грузии](https://nbg.gov.ge) при обнаружении мультивалютных счетов.
