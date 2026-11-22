# Implementation rules
- Resolve session names from `games.settings.title` in host/player views and persist them in offline snapshots; site-wide branding must not override a host's game name.
- Represent polls as text questions with `correctAnswer: -1`, matching the creator and scoring contract; do not add a poll media type.
- Keep removed bank topics out of default seed data so an empty database cannot restore reviewed-out questions.