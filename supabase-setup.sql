-- ============================================================
-- RFALCON — Configuración de Supabase para el formulario de reservas
-- ============================================================
-- CÓMO USARLO (una sola vez):
--  1. Entra a https://supabase.com/dashboard/project/cvvjimfgkcfeukshavha
--  2. Ve al menú "SQL Editor" (icono de consola en la barra izquierda).
--  3. Pega TODO este archivo y dale "Run".
--  4. Listo — ya existe la tabla "reservas" lista para recibir datos
--     desde la landing page, con seguridad configurada (RLS).
-- ============================================================

create table if not exists public.reservas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  equipo text not null,
  nombre_responsable text not null,
  rol text not null,
  celular text not null,
  plan text not null,
  fecha date not null,
  hora time not null,
  cancha text not null,
  estado text not null default 'pendiente' -- pendiente | confirmada | rechazada
);

-- Activa seguridad a nivel de fila (RLS). Sin esto, cualquiera con la
-- Anon Key (que vive en el HTML, es pública por diseño) podría leer,
-- editar o borrar TODAS las reservas. Con RLS activado y solo la
-- política de abajo, el sitio público únicamente puede INSERTAR
-- (crear) reservas nuevas — no puede leerlas, editarlas ni borrarlas.
alter table public.reservas enable row level security;

-- Permite que cualquier visitante del sitio (rol "anon") cree una
-- reserva nueva, pero no lea ni modifique las existentes.
create policy "Permitir insertar reservas desde la web"
  on public.reservas
  for insert
  to anon
  with check (true);

-- (Opcional) Si más adelante quieres ver las reservas desde un panel
-- propio autenticado (no desde la landing pública), deberías crear un
-- usuario/rol autenticado en Supabase y una política de SELECT solo
-- para ese rol — así el público nunca puede leer los datos de otros.
