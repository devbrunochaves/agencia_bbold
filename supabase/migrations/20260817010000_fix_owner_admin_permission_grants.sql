-- BBOLD Flow — fix Owner/Admin missing the 3 permissions added by phase 7
--
-- Found during homologação (applying all 9 migrations to a real, clean
-- Supabase project and inventorying the result): Owner had only 11 of the
-- 14 catalogued permissions, Admin only 10 of the 13 it should hold.
--
-- Root cause: 20260814170000_access_control.sql's comment claims "Owner
-- already gets every permission (cross join in the phase-1 seed) —
-- nothing to do there. Admin already gets everything except
-- organization.manage — the three new permissions above are picked up
-- automatically." That is false. The phase-1 seed's
-- `insert into role_permissions select ... cross join permissions` is a
-- one-time INSERT, not a live rule — it only granted the 11 permissions
-- that existed at the moment migration 3 ran. When migration 8 later
-- inserted members.view/settings.view/settings.manage into the catalogue,
-- nothing re-ran that cross join, so Owner and Admin silently never
-- received the 3 new permissions. Only Member got an explicit INSERT for
-- members.view in migration 8 — Owner and Admin got nothing.
--
-- This migration is the forward fix, not a manual/invisible DB patch: it's
-- versioned, idempotent (on conflict do nothing), and safe to run on any
-- environment at any point after migration 8, including a fresh database
-- (where it's a no-op, since migration 8 grants Member correctly and this
-- one would simply re-affirm Owner/Admin who'd already be correct if this
-- migration is applied in the same run — see also the note at the bottom
-- about why 20260814170000 itself is intentionally left unedited).

-- Owner: every permission that exists right now, cross-join —
-- same pattern as the original phase-1 seed, just re-run so it actually
-- covers permissions added after that seed.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'owner' and r.organization_id is null
on conflict do nothing;

-- Admin: every permission except organization.manage — same exclusion
-- rule as phase 1, re-run for the same reason.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key <> 'organization.manage'
where r.key = 'admin' and r.organization_id is null
on conflict do nothing;

-- Note on 20260814170000_access_control.sql: deliberately left unedited.
-- It already ran against the real BBOLD project before this bug was
-- caught, so rewriting it in place would desync the versioned file from
-- what's actually been applied to that environment — exactly what the
-- "no invisible manual correction" rule exists to prevent. Any *future*
-- migration that adds a new permission to the catalogue must remember to
-- explicitly grant it to Owner/Admin in that same migration (as this one
-- does), not assume a cross-join from years ago still applies.
