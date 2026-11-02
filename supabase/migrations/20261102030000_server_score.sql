-- The score is derived from the answers, so the server computes it and ignores what the client sends.
-- This covers forged scores, and old cached copies of the app that still use the previous formula.
-- It does not stop a student from changing their own answers: "own rows" still allows that.

create function private.compute_score() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.score := (select sum(a) from unnest(new.answers[1:9]) a) + (5 - new.answers[10]);
  return new;
end $$;

create trigger compute_score before insert or update of answers, score on public.assessments
  for each row execute function private.compute_score();

-- Rows saved by an old copy of the app since the formula changed. Fires the trigger above.
update public.assessments set answers = answers;
