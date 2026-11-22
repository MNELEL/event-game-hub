# Implementation rules
- Represent polls as text questions with `correctAnswer: -1`, matching the creator and scoring contract; do not add a poll media type.
- Keep removed bank topics out of default seed data so an empty database cannot restore reviewed-out questions.