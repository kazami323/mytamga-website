@AGENTS.md

## Команда и делегирование (MyTamga)

- Руководитель — основная сессия (Opus): ставит задачи, принимает работу, координирует production. Субагенты в `.claude/agents/`: `researcher` (haiku, только чтение), `implementer` (sonnet), `reviewer` (sonnet, не исправляет), `specialist` (opus — платежи, авторизация, удаление, миграции, восстановление, архитектура).
- План: `/Users/daniilmc/Desktop/Projects/MyTamga/docs/SITE_API_DECISIONS_2026-10-03_RU.md`. Журнал работ: `/Users/daniilmc/Desktop/Projects/MyTamga/docs/DEV_JOURNAL_RU.md`.
- Исполнители не создают агентов, не выкладывают в production, не делают reset/clean/stash/push и меняют только разрешённые в задании файлы.
- В рабочей копии приложения есть чужие незакоммиченные изменения: не включать их в релиз целиком, не перезаписывать.
- Секреты (`.env.production`, ключи, токены) не попадают в git, отчёты и чаты.
