-- Haqiqiy ko'ylak suratlari (oldi va orqa, foni olib tashlangan) — "fotodan 3D" ko'rinish uchun
alter table public.projects add column if not exists model_front text;
alter table public.projects add column if not exists model_back text;
comment on column public.projects.model_front is 'Ko''ylakning oldidan olingan, foni olib tashlangan surati (fotodan 3D)';
comment on column public.projects.model_back is 'Ko''ylakning orqasidan olingan, foni olib tashlangan surati (ixtiyoriy)';
