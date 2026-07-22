-- DataMart Tambo BI - Grupo 06 (UTP, 2026)
-- PostgreSQL / Supabase. Ejecutable de principio a fin e idempotente.
-- El esquema academico equivalente es: Hecho_Ventas y dimensiones en copo de nieve.

begin;

set local client_min_messages = warning;
set local timezone = 'America/Lima';

-- -----------------------------------------------------------------------------
-- Limpieza controlada de objetos propios de esta entrega
-- -----------------------------------------------------------------------------

drop function if exists public.get_predictive(integer, integer, integer, integer, date, date);
drop function if exists public.get_model_features();
drop function if exists public.get_customers(integer, integer, integer, integer, date, date);
drop function if exists public.get_promotions(integer, integer, integer, integer, date, date);
drop function if exists public.get_sales(integer, integer, integer, integer, date, date);
drop function if exists public.get_summary(integer, integer, integer, integer, date, date);
drop function if exists public.get_filter_options();

drop view if exists public."V_Encuesta_Limpia" cascade;
drop view if exists public."V_Ventas_Limpio" cascade;
drop view if exists public.v_model_features cascade;
drop view if exists public.v_descriptivos_18_25 cascade;
drop view if exists public.v_detalle_promociones cascade;
drop view if exists public.v_margen_por_categoria cascade;
drop view if exists public.v_ventas_por_producto cascade;
drop view if exists public.v_tendencia_ventas cascade;
drop view if exists public.v_margen_por_formato cascade;
drop view if exists public.v_ventas_por_formato cascade;
drop view if exists public.v_kpi_ventas_periodo_horario cascade;
drop view if exists public.v_kpi_rango_edades cascade;
drop view if exists public.v_kpi_frecuencia_uso_promocion cascade;
drop view if exists public.v_kpi_incremento_ventas cascade;
drop view if exists public.v_kpi_margen_ganancia cascade;
drop view if exists public.v_kpi_ventas_promocion cascade;
drop view if exists public.v_encuesta_limpia cascade;
drop view if exists public.v_ventas_limpio cascade;

drop table if exists public.prediccion_venta cascade;
drop table if exists public.coeficiente_modelo cascade;
drop table if exists public.modelo_predictivo cascade;
drop table if exists public.encuesta_clientes cascade;
drop table if exists public.hecho_ventas cascade;
drop table if exists public.dim_tiempo cascade;
drop table if exists public.dim_promocion cascade;
drop table if exists public.dim_campania cascade;
drop table if exists public.dim_tipo_promocion cascade;
drop table if exists public.dim_cliente cascade;
drop table if exists public.dim_tipo_cliente cascade;
drop table if exists public.dim_tienda cascade;
drop table if exists public.dim_distrito cascade;
drop table if exists public.dim_ciudad cascade;
drop table if exists public.dim_producto cascade;
drop table if exists public.dim_marca cascade;
drop table if exists public.dim_subcategoria cascade;
drop table if exists public.dim_categoria cascade;

-- -----------------------------------------------------------------------------
-- Dimensiones normalizadas (copo de nieve)
-- -----------------------------------------------------------------------------

create table public.dim_categoria (
  id_categoria integer primary key,
  nombre_categoria text not null unique,
  constraint dim_categoria_nombre_ck check (btrim(nombre_categoria) <> '')
);

comment on table public.dim_categoria is 'Dimension academica Dim_Categoria.';

create table public.dim_subcategoria (
  id_subcategoria integer primary key,
  id_categoria integer not null references public.dim_categoria(id_categoria),
  nombre_subcategoria text not null,
  constraint dim_subcategoria_nombre_ck check (btrim(nombre_subcategoria) <> ''),
  constraint dim_subcategoria_nombre_uk unique (id_categoria, nombre_subcategoria)
);

comment on table public.dim_subcategoria is 'Dimension academica Dim_Subcategoria; enlaza Producto con Categoria.';

create table public.dim_marca (
  id_marca integer primary key,
  nombre_marca text not null unique,
  constraint dim_marca_nombre_ck check (btrim(nombre_marca) <> '')
);

comment on table public.dim_marca is 'Dimension academica Dim_Marca.';

create table public.dim_producto (
  id_producto integer primary key,
  id_subcategoria integer not null references public.dim_subcategoria(id_subcategoria),
  id_marca integer not null references public.dim_marca(id_marca),
  nombre_producto text not null unique,
  unidad_medida text not null default 'unidad',
  precio_referencia numeric(10,2) not null check (precio_referencia >= 0)
);

create index dim_producto_subcategoria_idx on public.dim_producto(id_subcategoria);
create index dim_producto_marca_idx on public.dim_producto(id_marca);

comment on table public.dim_producto is 'Dimension academica Dim_Producto.';

create table public.dim_ciudad (
  id_ciudad integer primary key,
  nombre_ciudad text not null unique
);

create table public.dim_distrito (
  id_distrito integer primary key,
  id_ciudad integer not null references public.dim_ciudad(id_ciudad),
  nombre_distrito text not null,
  constraint dim_distrito_nombre_uk unique (id_ciudad, nombre_distrito)
);

create table public.dim_tienda (
  id_tienda integer primary key,
  id_distrito integer not null references public.dim_distrito(id_distrito),
  nombre_tienda text not null unique,
  codigo_tienda text not null unique
);

create index dim_tienda_distrito_idx on public.dim_tienda(id_distrito);

comment on table public.dim_tienda is 'Dimension academica Dim_Tienda; enlaza Tienda con Distrito y Ciudad.';

create table public.dim_tipo_cliente (
  id_tipo_cliente integer primary key,
  nombre_tipo_cliente text not null unique
);

create table public.dim_cliente (
  id_cliente integer primary key,
  id_tipo_cliente integer not null references public.dim_tipo_cliente(id_tipo_cliente),
  edad integer not null check (edad between 16 and 80),
  genero text not null check (genero in ('Femenino', 'Masculino', 'No binario', 'Prefiere no indicar'))
);

create index dim_cliente_tipo_idx on public.dim_cliente(id_tipo_cliente);

comment on table public.dim_cliente is 'Dimension academica Dim_Cliente; datos sinteticos sin PII.';

create table public.dim_tipo_promocion (
  id_tipo_promocion integer primary key,
  nombre_tipo_promocion text not null unique,
  codigo_modelo integer not null unique check (codigo_modelo > 0)
);

create table public.dim_campania (
  id_campania integer primary key,
  nombre_campania text not null unique,
  fecha_inicio date not null,
  fecha_fin date not null,
  constraint dim_campania_fechas_ck check (fecha_fin >= fecha_inicio)
);

create table public.dim_promocion (
  id_promocion integer primary key,
  id_tipo_promocion integer not null references public.dim_tipo_promocion(id_tipo_promocion),
  id_campania integer not null references public.dim_campania(id_campania),
  nombre_promocion text not null unique,
  porcentaje_descuento numeric(5,2) not null default 0 check (porcentaje_descuento between 0 and 100),
  fecha_inicio date not null,
  fecha_fin date not null,
  activa boolean not null default true,
  constraint dim_promocion_fechas_ck check (fecha_fin >= fecha_inicio)
);

create index dim_promocion_tipo_idx on public.dim_promocion(id_tipo_promocion);
create index dim_promocion_campania_idx on public.dim_promocion(id_campania);

comment on table public.dim_promocion is 'Dimension academica Dim_Promocion; enlaza TipoPromocion y Campania.';

create table public.dim_tiempo (
  id_tiempo integer primary key,
  fecha date not null unique,
  dia smallint not null check (dia between 1 and 31),
  mes smallint not null check (mes between 1 and 12),
  nombre_mes text not null,
  trimestre smallint not null check (trimestre between 1 and 4),
  anio smallint not null,
  dia_semana text not null,
  es_fin_semana boolean not null
);

comment on table public.dim_tiempo is 'Dimension academica Dim_Tiempo.';

-- -----------------------------------------------------------------------------
-- Hecho de ventas y encuesta independiente
-- -----------------------------------------------------------------------------

create table public.hecho_ventas (
  id_venta integer primary key,
  id_producto integer not null references public.dim_producto(id_producto),
  id_cliente integer not null references public.dim_cliente(id_cliente),
  id_tienda integer not null references public.dim_tienda(id_tienda),
  id_promocion integer references public.dim_promocion(id_promocion),
  id_tiempo integer not null references public.dim_tiempo(id_tiempo),
  hora_venta time not null,
  cantidad_vendida integer not null check (cantidad_vendida > 0),
  total_venta numeric(10,2) not null check (total_venta >= 0),
  costo_total numeric(10,2) not null check (costo_total >= 0),
  descuento_aplicado numeric(10,2) not null default 0 check (descuento_aplicado >= 0),
  margen_ganancia numeric(10,2) generated always as (total_venta - costo_total) stored
);

comment on table public.hecho_ventas is 'Tabla de hechos academica Hecho_Ventas. id_promocion es nullable solo para ventas sin promocion.';

create index hecho_ventas_producto_idx on public.hecho_ventas(id_producto);
create index hecho_ventas_cliente_idx on public.hecho_ventas(id_cliente);
create index hecho_ventas_tienda_idx on public.hecho_ventas(id_tienda);
create index hecho_ventas_promocion_idx on public.hecho_ventas(id_promocion);
create index hecho_ventas_tiempo_idx on public.hecho_ventas(id_tiempo);

create table public.encuesta_clientes (
  id_encuesta integer primary key,
  id_tipo_cliente integer not null references public.dim_tipo_cliente(id_tipo_cliente),
  id_tienda integer not null references public.dim_tienda(id_tienda),
  fecha_encuesta date not null,
  edad integer not null check (edad between 16 and 80),
  genero text not null check (genero in ('Femenino', 'Masculino', 'No binario', 'Prefiere no indicar')),
  visitas_semanales integer not null check (visitas_semanales between 0 and 7),
  frecuencia_uso_promocion integer not null check (frecuencia_uso_promocion between 0 and 3),
  aprovechamiento_promocion integer not null check (aprovechamiento_promocion between 0 and 3),
  atractivo_promociones integer not null check (atractivo_promociones between 1 and 3),
  satisfaccion integer not null check (satisfaccion between 1 and 3),
  identifica_promociones boolean not null,
  percibe_ahorro boolean not null,
  formato_preferido text not null,
  horario_preferido text not null check (horario_preferido in ('Manana', 'Tarde', 'Noche'))
);

create index encuesta_clientes_tipo_idx on public.encuesta_clientes(id_tipo_cliente);
create index encuesta_clientes_tienda_idx on public.encuesta_clientes(id_tienda);

comment on table public.encuesta_clientes is 'Encuesta_Clientes: 50 respuestas sinteticas y anonimas.';

-- -----------------------------------------------------------------------------
-- Tablas para resultados reproducibles del modelo predictivo
-- -----------------------------------------------------------------------------

create table public.modelo_predictivo (
  id_modelo integer primary key,
  version_modelo text not null unique,
  algoritmo text not null,
  semilla integer not null,
  porcentaje_entrenamiento numeric(5,2) not null,
  filas_entrenamiento integer not null,
  filas_prueba integer not null,
  r2 numeric(12,8) not null,
  mae numeric(12,8) not null,
  rmse numeric(12,8) not null,
  intercepto numeric(18,10) not null,
  entrenado_en timestamptz not null
);

create table public.coeficiente_modelo (
  id_modelo integer not null references public.modelo_predictivo(id_modelo),
  variable text not null,
  orden integer not null,
  coeficiente_original numeric(18,10) not null,
  coeficiente_estandarizado numeric(18,10) not null,
  primary key (id_modelo, variable),
  unique (id_modelo, orden)
);

create table public.prediccion_venta (
  id_modelo integer not null references public.modelo_predictivo(id_modelo),
  id_venta integer not null references public.hecho_ventas(id_venta),
  conjunto text not null check (conjunto in ('prueba')),
  venta_real numeric(10,2) not null,
  venta_proyectada numeric(12,6) not null,
  residual numeric(12,6) generated always as (venta_real - venta_proyectada) stored,
  primary key (id_modelo, id_venta)
);

create index prediccion_venta_id_venta_idx on public.prediccion_venta(id_venta);

-- -----------------------------------------------------------------------------
-- Catalogos
-- -----------------------------------------------------------------------------

insert into public.dim_categoria values
  (1, 'Bebidas'),
  (2, 'Snacks'),
  (3, 'Confiteria'),
  (4, 'Lacteos'),
  (5, 'Comidas preparadas');

insert into public.dim_subcategoria values
  (1, 1, 'Gaseosas'),
  (2, 1, 'Agua'),
  (3, 1, 'Cafe'),
  (4, 2, 'Papas'),
  (5, 2, 'Galletas'),
  (6, 3, 'Chocolates'),
  (7, 4, 'Yogures'),
  (8, 5, 'Sandwiches');

insert into public.dim_marca values
  (1, 'Coca-Cola'),
  (2, 'Lay''s'),
  (3, 'Nestle'),
  (4, 'Oreo'),
  (5, 'Gloria'),
  (6, 'Tambo'),
  (7, 'San Mateo');

insert into public.dim_producto values
  (1, 1, 1, 'Coca-Cola 500 ml', 'unidad', 4.50),
  (2, 4, 2, 'Papas Lay''s 45 g', 'unidad', 3.50),
  (3, 6, 3, 'Chocolate Sublime 30 g', 'unidad', 2.50),
  (4, 5, 4, 'Galletas Oreo 36 g', 'unidad', 2.80),
  (5, 7, 5, 'Yogurt Gloria 180 g', 'unidad', 3.20),
  (6, 3, 6, 'Cafe americano', 'unidad', 4.00),
  (7, 8, 6, 'Sandwich mixto', 'unidad', 6.50),
  (8, 2, 7, 'Agua San Mateo 625 ml', 'unidad', 2.20);

insert into public.dim_ciudad values (1, 'Lima');

insert into public.dim_distrito values
  (1, 1, 'Jesus Maria'),
  (2, 1, 'Lince'),
  (3, 1, 'Cercado de Lima');

insert into public.dim_tienda values
  (1, 1, 'UC · Av. Universitaria', 'UC-AVU-01'),
  (2, 2, 'UC · Puerta 3', 'UC-P03-02'),
  (3, 3, 'UC · Óvalo', 'UC-OVA-03');

insert into public.dim_tipo_cliente values
  (1, 'Estudiante'),
  (2, 'Docente'),
  (3, 'Visitante');

insert into public.dim_cliente (id_cliente, id_tipo_cliente, edad, genero)
select
  n,
  case when n <= 25 then 1 when n % 3 = 0 then 2 else 3 end,
  case when n <= 25 then 18 + ((n - 1) % 8) else 26 + ((n - 26) % 25) end,
  case when n % 4 = 0 then 'Prefiere no indicar'
       when n % 2 = 0 then 'Masculino'
       else 'Femenino' end
from generate_series(1, 50) as g(n);

insert into public.dim_tipo_promocion values
  (1, '2x1', 1),
  (2, 'Combo', 2),
  (3, 'Descuento directo', 3),
  (4, 'Regalo', 4),
  (5, 'Temporada', 5);

insert into public.dim_campania values
  (1, 'Ahorro UC', date '2026-06-01', date '2026-06-30'),
  (2, 'Regreso a clases', date '2026-06-01', date '2026-06-30'),
  (3, 'Desayunos UC', date '2026-06-01', date '2026-06-30');

insert into public.dim_promocion values
  (1, 1, 1, '2x1 Gaseosas 500ml', 50.00, date '2026-06-01', date '2026-06-30', true),
  (2, 2, 1, 'Combo Snack + Bebida', 20.00, date '2026-06-01', date '2026-06-30', true),
  (3, 3, 1, 'Chocolate 2da a -50%', 25.00, date '2026-06-01', date '2026-06-30', true),
  (4, 1, 2, '2x1 Galletas', 50.00, date '2026-06-01', date '2026-06-30', true),
  (5, 4, 1, 'Yogurt + cuchara gratis', 0.00, date '2026-06-01', date '2026-06-30', true),
  (6, 2, 3, 'Combo Desayuno UC', 18.00, date '2026-06-01', date '2026-06-30', true),
  (7, 5, 2, 'Temporada Regreso', 15.00, date '2026-06-01', date '2026-06-30', true),
  (8, 1, 1, 'Agua 2x1 625ml', 50.00, date '2026-06-01', date '2026-06-30', true);

insert into public.dim_tiempo
select
  to_char(d, 'YYYYMMDD')::integer,
  d,
  extract(day from d)::smallint,
  extract(month from d)::smallint,
  case extract(month from d)::integer when 6 then 'Junio' end,
  extract(quarter from d)::smallint,
  extract(year from d)::smallint,
  case extract(isodow from d)::integer
    when 1 then 'Lunes' when 2 then 'Martes' when 3 then 'Miercoles'
    when 4 then 'Jueves' when 5 then 'Viernes' when 6 then 'Sabado' else 'Domingo'
  end,
  extract(isodow from d) in (6, 7)
from generate_series(date '2026-06-01', date '2026-06-30', interval '1 day') as x(d);

-- -----------------------------------------------------------------------------
-- 100 ventas deterministicas con totales exactos por formato
-- -----------------------------------------------------------------------------

with grupos as (
  select * from (values
    (1, '2x1',                1,  28, 22410, -1890),
    (2, 'Combo',             29,   8,  6000,  1920),
    (3, 'Descuento directo', 37,   8,  5000,  1350),
    (4, 'Regalo',            45,   6,  2800,   420),
    (5, 'Temporada',         51,   5,  2295,   710),
    (6, 'Sin promocion',     56,  45, 29090,  8505)
  ) as x(grupo_id, formato, primer_id, transacciones, ventas_centimos, margen_centimos)
), filas as (
  select
    g.*,
    s as posicion,
    g.primer_id + s - 1 as id_venta,
    (g.ventas_centimos / g.transacciones)
      + case when s <= (g.ventas_centimos % g.transacciones) then 1 else 0 end as venta_centimos,
    case
      when g.margen_centimos >= 0 then
        (g.margen_centimos / g.transacciones)
          + case when s <= (g.margen_centimos % g.transacciones) then 1 else 0 end
      else
        - ((abs(g.margen_centimos) / g.transacciones)
          + case when s <= (abs(g.margen_centimos) % g.transacciones) then 1 else 0 end)
    end as margen_fila_centimos
  from grupos g
  cross join lateral generate_series(1, g.transacciones) as gs(s)
), asignadas as (
  select
    f.*,
    case f.grupo_id
      when 1 then (array[1,4,8])[1 + ((f.posicion - 1) % 3)]
      when 2 then (array[2,6])[1 + ((f.posicion - 1) % 2)]
      when 3 then 3
      when 4 then 5
      when 5 then 7
      else null
    end as id_promocion,
    case f.grupo_id
      when 1 then (array[1,4,8])[1 + ((f.posicion - 1) % 3)]
      when 2 then (array[2,6])[1 + ((f.posicion - 1) % 2)]
      when 3 then 3
      when 4 then 5
      when 5 then 7
      else 1 + ((f.id_venta - 1) % 8)
    end as id_producto
  from filas f
)
insert into public.hecho_ventas (
  id_venta, id_producto, id_cliente, id_tienda, id_promocion, id_tiempo,
  hora_venta, cantidad_vendida, total_venta, costo_total, descuento_aplicado
)
select
  a.id_venta,
  a.id_producto,
  1 + ((a.id_venta - 1) % 50),
  1 + ((a.id_venta - 1) % 3),
  a.id_promocion,
  to_char(date '2026-06-01' + ((a.id_venta - 1) % 30), 'YYYYMMDD')::integer,
  case
    when a.id_venta <= 23 then time '08:00' + ((a.id_venta % 180) * interval '1 minute')
    when a.id_venta <= 58 then time '13:00' + ((a.id_venta % 240) * interval '1 minute')
    else time '19:00' + ((a.id_venta % 240) * interval '1 minute')
  end,
  1 + (a.id_venta % 3),
  a.venta_centimos::numeric / 100,
  (a.venta_centimos - a.margen_fila_centimos)::numeric / 100,
  case
    when a.id_promocion is null then 0
    when p.porcentaje_descuento = 0 then 0
    when p.porcentaje_descuento = 100 then 0
    else round((a.venta_centimos::numeric / 100) * p.porcentaje_descuento / (100 - p.porcentaje_descuento), 2)
  end
from asignadas a
left join public.dim_promocion p on p.id_promocion = a.id_promocion
order by a.id_venta;

-- -----------------------------------------------------------------------------
-- 50 encuestas. Primeras 25 filas = segmento 18-25 con descriptivos exactos.
-- -----------------------------------------------------------------------------

with segmento as (
  select
    n,
    (array[0,0,0,0,0, 1,1,1,1,1,1,1,1,1,1, 2,2,2,2,2,2, 3,3,3,3])[n] as visitas,
    (array[0, 1,1,1,1,1,1,1,1,1, 2,2,2,2,2,2,2, 3,3,3,3,3,3,3,3])[n] as aprovecha,
    (array[1,1,1,1, 2,2,2,2,2,2,2,2,2,2,2, 3,3,3,3,3,3,3,3,3,3])[n] as atractivo,
    (array[1,1,1, 2,2,2,2,2,2,2,2,2,2,2,2,2,2, 3,3,3,3,3,3,3,3])[n] as satisfaccion
  from generate_series(1, 25) as g(n)
), resto as (
  select n from generate_series(26, 50) as g(n)
)
insert into public.encuesta_clientes (
  id_encuesta, id_tipo_cliente, id_tienda, fecha_encuesta, edad, genero,
  visitas_semanales, frecuencia_uso_promocion, aprovechamiento_promocion,
  atractivo_promociones, satisfaccion, identifica_promociones, percibe_ahorro,
  formato_preferido, horario_preferido
)
select
  s.n,
  1,
  1 + ((s.n - 1) % 3),
  date '2026-06-01' + ((s.n - 1) % 30),
  18 + ((s.n - 1) % 8),
  case when s.n % 2 = 0 then 'Masculino' else 'Femenino' end,
  s.visitas,
  s.aprovecha,
  s.aprovecha,
  s.atractivo,
  s.satisfaccion,
  s.n <= 23,
  s.n <= 22,
  case when s.n <= 21 then '2x1'
       when s.n = 22 then 'Combo'
       when s.n = 23 then 'Descuento directo'
       when s.n = 24 then 'Regalo'
       else 'Temporada' end,
  (array['Manana','Tarde','Noche'])[1 + ((s.n - 1) % 3)]
from segmento s
union all
select
  r.n,
  case when r.n % 3 = 0 then 2 else 3 end,
  1 + ((r.n - 1) % 3),
  date '2026-06-01' + ((r.n - 1) % 30),
  26 + ((r.n - 26) % 25),
  case when r.n % 4 = 0 then 'Prefiere no indicar'
       when r.n % 2 = 0 then 'Masculino' else 'Femenino' end,
  r.n % 4,
  (array[0, 1,1,1,1,1,1,1,1,1, 2,2,2,2,2,2,2, 3,3,3,3,3,3,3,3])[r.n - 25],
  r.n % 4,
  1 + (r.n % 3),
  1 + ((r.n + 1) % 3),
  r.n % 5 <> 0,
  r.n % 4 <> 0,
  (array['Combo','2x1','Descuento directo','Regalo','Temporada'])[1 + ((r.n - 26) % 5)],
  (array['Tarde','Noche','Manana'])[1 + ((r.n - 26) % 3)]
from resto r
order by 1;

-- -----------------------------------------------------------------------------
-- Vistas de limpieza
-- -----------------------------------------------------------------------------

create view public.v_ventas_limpio
with (security_invoker = true)
as
select
  hv.id_venta,
  hv.id_producto,
  btrim(dp.nombre_producto) as producto,
  ds.id_subcategoria,
  btrim(ds.nombre_subcategoria) as subcategoria,
  dc.id_categoria,
  btrim(dc.nombre_categoria) as categoria,
  dm.id_marca,
  btrim(dm.nombre_marca) as marca,
  hv.id_cliente,
  cli.edad,
  cli.genero,
  tc.id_tipo_cliente,
  btrim(tc.nombre_tipo_cliente) as tipo_cliente,
  hv.id_tienda,
  btrim(dt.nombre_tienda) as tienda,
  dd.id_distrito,
  btrim(dd.nombre_distrito) as distrito,
  ci.id_ciudad,
  btrim(ci.nombre_ciudad) as ciudad,
  hv.id_promocion,
  coalesce(btrim(pr.nombre_promocion), 'Sin promocion') as promocion,
  tp.id_tipo_promocion,
  coalesce(btrim(tp.nombre_tipo_promocion), 'Sin promocion') as formato_promocion,
  ca.id_campania,
  coalesce(btrim(ca.nombre_campania), 'Sin campania') as campania,
  coalesce(pr.porcentaje_descuento, 0)::numeric(5,2) as porcentaje_descuento,
  ti.id_tiempo,
  ti.fecha::date as fecha,
  ti.dia,
  ti.mes,
  btrim(ti.nombre_mes) as nombre_mes,
  ti.trimestre,
  ti.anio,
  btrim(ti.dia_semana) as dia_semana,
  ti.es_fin_semana,
  hv.hora_venta,
  case
    when hv.hora_venta < time '12:00' then 'Manana'
    when hv.hora_venta < time '18:00' then 'Tarde'
    else 'Noche'
  end as franja_horaria,
  greatest(coalesce(hv.cantidad_vendida, 0), 0) as cantidad_vendida,
  greatest(coalesce(hv.total_venta, 0), 0)::numeric(10,2) as total_venta,
  greatest(coalesce(hv.costo_total, 0), 0)::numeric(10,2) as costo_total,
  greatest(coalesce(hv.descuento_aplicado, 0), 0)::numeric(10,2) as descuento_aplicado,
  (
    greatest(coalesce(hv.total_venta, 0), 0)
    - greatest(coalesce(hv.costo_total, 0), 0)
  )::numeric(10,2) as margen_ganancia
from public.hecho_ventas hv
join public.dim_producto dp on dp.id_producto = hv.id_producto
join public.dim_subcategoria ds on ds.id_subcategoria = dp.id_subcategoria
join public.dim_categoria dc on dc.id_categoria = ds.id_categoria
join public.dim_marca dm on dm.id_marca = dp.id_marca
join public.dim_cliente cli on cli.id_cliente = hv.id_cliente
join public.dim_tipo_cliente tc on tc.id_tipo_cliente = cli.id_tipo_cliente
join public.dim_tienda dt on dt.id_tienda = hv.id_tienda
join public.dim_distrito dd on dd.id_distrito = dt.id_distrito
join public.dim_ciudad ci on ci.id_ciudad = dd.id_ciudad
left join public.dim_promocion pr on pr.id_promocion = hv.id_promocion
left join public.dim_tipo_promocion tp on tp.id_tipo_promocion = pr.id_tipo_promocion
left join public.dim_campania ca on ca.id_campania = pr.id_campania
join public.dim_tiempo ti on ti.id_tiempo = hv.id_tiempo;

create view public.v_encuesta_limpia
with (security_invoker = true)
as
select
  e.id_encuesta,
  e.id_tipo_cliente,
  btrim(tc.nombre_tipo_cliente) as tipo_cliente,
  e.id_tienda,
  btrim(t.nombre_tienda) as tienda,
  e.fecha_encuesta::date,
  greatest(e.edad, 0) as edad,
  btrim(e.genero) as genero,
  greatest(coalesce(e.visitas_semanales, 0), 0) as visitas_semanales,
  greatest(coalesce(e.frecuencia_uso_promocion, 0), 0) as frecuencia_uso_promocion,
  greatest(coalesce(e.aprovechamiento_promocion, 0), 0) as aprovechamiento_promocion,
  greatest(coalesce(e.atractivo_promociones, 0), 0) as atractivo_promociones,
  greatest(coalesce(e.satisfaccion, 0), 0) as satisfaccion,
  coalesce(e.identifica_promociones, false) as identifica_promociones,
  coalesce(e.percibe_ahorro, false) as percibe_ahorro,
  case lower(btrim(e.formato_preferido))
    when '2x1' then '2x1'
    when 'combo' then 'Combo'
    when 'descuento directo' then 'Descuento directo'
    when 'regalo' then 'Regalo'
    when 'temporada' then 'Temporada'
    else initcap(btrim(e.formato_preferido))
  end as formato_preferido,
  initcap(btrim(e.horario_preferido)) as horario_preferido,
  case
    when e.edad between 18 and 25 then '18-25'
    when e.edad between 26 and 35 then '26-35'
    when e.edad between 36 and 45 then '36-45'
    else '46+'
  end as rango_edad
from public.encuesta_clientes e
join public.dim_tipo_cliente tc on tc.id_tipo_cliente = e.id_tipo_cliente
join public.dim_tienda t on t.id_tienda = e.id_tienda;

create view public."V_Ventas_Limpio"
with (security_invoker = true)
as select * from public.v_ventas_limpio;

create view public."V_Encuesta_Limpia"
with (security_invoker = true)
as select * from public.v_encuesta_limpia;

-- -----------------------------------------------------------------------------
-- Vistas analiticas de los 6 KPI y graficos
-- -----------------------------------------------------------------------------

create view public.v_kpi_ventas_promocion with (security_invoker = true) as
select
  round(sum(total_venta), 2) as ventas_promocion,
  count(*)::integer as transacciones_promocion
from public.v_ventas_limpio
where id_promocion is not null;

create view public.v_kpi_margen_ganancia with (security_invoker = true) as
select
  round(sum(total_venta), 2) as ventas,
  round(sum(costo_total), 2) as costos,
  round(sum(margen_ganancia), 2) as margen_acumulado,
  round(100 * sum(margen_ganancia) / nullif(sum(total_venta), 0), 1) as margen_porcentaje
from public.v_ventas_limpio;

create view public.v_kpi_incremento_ventas with (security_invoker = true) as
with x as (
  select
    sum(total_venta) filter (where id_promocion is not null) as ventas_con_promocion,
    sum(total_venta) filter (where id_promocion is null) as ventas_sin_promocion
  from public.v_ventas_limpio
)
select
  round(ventas_con_promocion, 2) as ventas_con_promocion,
  round(ventas_sin_promocion, 2) as ventas_sin_promocion,
  round(100 * (ventas_con_promocion - ventas_sin_promocion) / nullif(ventas_sin_promocion, 0), 1) as incremento_porcentaje
from x;

create view public.v_kpi_frecuencia_uso_promocion with (security_invoker = true) as
select
  round(avg(frecuencia_uso_promocion)::numeric, 2) as frecuencia_media,
  round(avg(aprovechamiento_promocion)::numeric, 2) as aprovechamiento_medio,
  count(*)::integer as respuestas
from public.v_encuesta_limpia;

create view public.v_kpi_rango_edades with (security_invoker = true) as
select rango_edad, count(*)::integer as respuestas,
       round(100 * count(*) / sum(count(*)) over (), 1) as porcentaje
from public.v_encuesta_limpia
group by rango_edad;

create view public.v_kpi_ventas_periodo_horario with (security_invoker = true) as
select
  franja_horaria,
  count(*)::integer as transacciones,
  round(sum(total_venta), 2) as ventas,
  round(100 * count(*) / sum(count(*)) over (), 1) as porcentaje_transacciones
from public.v_ventas_limpio
group by franja_horaria;

create view public.v_ventas_por_formato with (security_invoker = true) as
select
  formato_promocion as formato,
  count(*)::integer as transacciones,
  round(sum(total_venta), 2) as ventas
from public.v_ventas_limpio
group by formato_promocion;

create view public.v_margen_por_formato with (security_invoker = true) as
select
  formato_promocion as formato,
  round(sum(total_venta), 2) as ventas,
  round(sum(margen_ganancia), 2) as margen,
  round(100 * sum(margen_ganancia) / nullif(sum(total_venta), 0), 1) as margen_porcentaje
from public.v_ventas_limpio
group by formato_promocion;

create view public.v_tendencia_ventas with (security_invoker = true) as
select
  fecha,
  count(*)::integer as transacciones,
  round(sum(total_venta), 2) as ventas,
  round(sum(margen_ganancia), 2) as margen
from public.v_ventas_limpio
group by fecha
order by fecha;

create view public.v_ventas_por_producto with (security_invoker = true) as
select
  id_producto,
  producto,
  categoria,
  round(sum(total_venta), 2) as ventas,
  sum(cantidad_vendida)::integer as unidades,
  count(*)::integer as transacciones
from public.v_ventas_limpio
group by id_producto, producto, categoria;

create view public.v_margen_por_categoria with (security_invoker = true) as
select
  id_categoria,
  categoria,
  round(sum(total_venta), 2) as ventas,
  round(sum(margen_ganancia), 2) as margen,
  round(100 * sum(margen_ganancia) / nullif(sum(total_venta), 0), 1) as margen_porcentaje
from public.v_ventas_limpio
group by id_categoria, categoria;

create view public.v_detalle_promociones with (security_invoker = true) as
select
  id_promocion,
  promocion,
  formato_promocion as formato,
  campania,
  count(*)::integer as transacciones,
  round(sum(total_venta), 2) as ventas,
  round(sum(margen_ganancia), 2) as margen,
  round(100 * sum(margen_ganancia) / nullif(sum(total_venta), 0), 1) as margen_porcentaje
from public.v_ventas_limpio
where id_promocion is not null
group by id_promocion, promocion, formato_promocion, campania;

create view public.v_descriptivos_18_25 with (security_invoker = true) as
select
  count(*)::integer as n,
  round(avg(visitas_semanales)::numeric, 2) as visita_media,
  round(stddev_samp(visitas_semanales)::numeric, 2) as visita_de,
  round(avg(aprovechamiento_promocion)::numeric, 2) as aprovechamiento_media,
  round(stddev_samp(aprovechamiento_promocion)::numeric, 2) as aprovechamiento_de,
  round(avg(atractivo_promociones)::numeric, 2) as atractivo_media,
  round(stddev_samp(atractivo_promociones)::numeric, 2) as atractivo_de,
  round(avg(satisfaccion)::numeric, 2) as satisfaccion_media,
  round(stddev_samp(satisfaccion)::numeric, 2) as satisfaccion_de,
  round(100 * avg(identifica_promociones::integer), 0) as identifica_porcentaje,
  round(100 * avg(percibe_ahorro::integer), 0) as ahorro_porcentaje,
  round(100 * avg((formato_preferido = '2x1')::integer), 0) as prefiere_2x1_porcentaje
from public.v_encuesta_limpia
where edad between 18 and 25;

create view public.v_model_features with (security_invoker = true) as
select
  v.id_venta,
  v.total_venta::double precision as objetivo_venta,
  v.porcentaje_descuento::double precision as porcentaje_descuento,
  coalesce(tp.codigo_modelo, 0)::double precision as codigo_tipo_promocion,
  v.id_categoria::double precision as codigo_categoria,
  v.es_fin_semana::integer::double precision as es_fin_semana,
  case v.franja_horaria when 'Manana' then 0 when 'Tarde' then 1 else 2 end::double precision as codigo_franja_horaria,
  v.edad::double precision as edad_cliente
from public.v_ventas_limpio v
left join public.dim_promocion p on p.id_promocion = v.id_promocion
left join public.dim_tipo_promocion tp on tp.id_tipo_promocion = p.id_tipo_promocion;

-- Los INSERT del modelo se completan mediante scripts/train_model.py.
-- Esta migracion incluye la version materializada para despliegue reproducible.

insert into public.modelo_predictivo (
  id_modelo, version_modelo, algoritmo, semilla, porcentaje_entrenamiento,
  filas_entrenamiento, filas_prueba, r2, mae, rmse, intercepto, entrenado_en
) values
  (1, 'tambo-lm-v1-seed42', 'Regresion lineal multiple OLS', 42, 70.00,
   70, 30, 0.8355578633, 0.2577752431, 0.4443208176, 6.4321117110,
   timestamptz '2026-06-30 23:59:00-05');

insert into public.coeficiente_modelo (
  id_modelo, variable, orden, coeficiente_original, coeficiente_estandarizado
) values
  (1, 'porcentaje_descuento', 1, 0.0402868636, 0.8839965898),
  (1, 'codigo_tipo_promocion', 2, -0.4077930343, -0.6004281291),
  (1, 'codigo_categoria', 3, -0.0552525937, -0.0734643149),
  (1, 'es_fin_semana', 4, 0.0389739305, 0.0170518932),
  (1, 'codigo_franja_horaria', 5, 0.0297248234, 0.0245284046),
  (1, 'edad_cliente', 6, 0.0036745750, 0.0374759952);

insert into public.prediccion_venta (
  id_modelo, id_venta, conjunto, venta_real, venta_proyectada
) values
  (1, 2, 'prueba', 8.01, 7.997974),
  (1, 10, 'prueba', 8.01, 8.053226),
  (1, 16, 'prueba', 8.00, 8.075274),
  (1, 18, 'prueba', 8.00, 8.053226),
  (1, 19, 'prueba', 8.00, 8.056901),
  (1, 23, 'prueba', 8.00, 8.016346),
  (1, 24, 'prueba', 8.00, 8.104998),
  (1, 27, 'prueba', 8.00, 8.151322),
  (1, 28, 'prueba', 8.00, 8.154996),
  (1, 30, 'prueba', 7.50, 6.426399),
  (1, 31, 'prueba', 7.50, 6.455394),
  (1, 32, 'prueba', 7.50, 6.433748),
  (1, 34, 'prueba', 7.50, 6.441097),
  (1, 35, 'prueba', 7.50, 6.470093),
  (1, 38, 'prueba', 6.25, 6.219505),
  (1, 43, 'prueba', 6.25, 6.276852),
  (1, 48, 'prueba', 4.67, 4.786034),
  (1, 50, 'prueba', 4.66, 4.832357),
  (1, 51, 'prueba', 4.59, 4.856028),
  (1, 55, 'prueba', 4.59, 4.831752),
  (1, 59, 'prueba', 6.47, 6.391946),
  (1, 60, 'prueba', 6.47, 6.450873),
  (1, 71, 'prueba', 6.47, 6.296139),
  (1, 73, 'prueba', 6.47, 6.563472),
  (1, 74, 'prueba', 6.47, 6.511894),
  (1, 75, 'prueba', 6.47, 6.391946),
  (1, 81, 'prueba', 6.46, 6.589195),
  (1, 85, 'prueba', 6.46, 6.399161),
  (1, 95, 'prueba', 6.46, 6.380654),
  (1, 96, 'prueba', 6.46, 6.644313);

-- -----------------------------------------------------------------------------
-- RPC: todas comparten exactamente el mismo contrato de filtros
-- -----------------------------------------------------------------------------

create function public.get_filter_options()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
select jsonb_build_object(
  'tiendas', coalesce((select jsonb_agg(jsonb_build_object('id', id_tienda, 'nombre', nombre_tienda) order by nombre_tienda) from public.dim_tienda), '[]'::jsonb),
  'categorias', coalesce((select jsonb_agg(jsonb_build_object('id', id_categoria, 'nombre', nombre_categoria) order by nombre_categoria) from public.dim_categoria), '[]'::jsonb),
  'campanias', coalesce((select jsonb_agg(jsonb_build_object('id', id_campania, 'nombre', nombre_campania) order by nombre_campania) from public.dim_campania), '[]'::jsonb),
  'tiposCliente', coalesce((select jsonb_agg(jsonb_build_object('id', id_tipo_cliente, 'nombre', nombre_tipo_cliente) order by nombre_tipo_cliente) from public.dim_tipo_cliente), '[]'::jsonb),
  'fechaMin', (select min(fecha) from public.dim_tiempo),
  'fechaMax', (select max(fecha) from public.dim_tiempo)
);
$$;

create function public.get_summary(
  p_tienda_id integer default null,
  p_categoria_id integer default null,
  p_campania_id integer default null,
  p_tipo_cliente_id integer default null,
  p_fecha_desde date default null,
  p_fecha_hasta date default null
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
with ventas as (
  select * from public.v_ventas_limpio v
  where (p_tienda_id is null or v.id_tienda = p_tienda_id)
    and (p_categoria_id is null or v.id_categoria = p_categoria_id)
    and (p_campania_id is null or v.id_campania = p_campania_id)
    and (p_tipo_cliente_id is null or v.id_tipo_cliente = p_tipo_cliente_id)
    and (p_fecha_desde is null or v.fecha >= p_fecha_desde)
    and (p_fecha_hasta is null or v.fecha <= p_fecha_hasta)
), encuesta as (
  select * from public.v_encuesta_limpia e
  where (p_tienda_id is null or e.id_tienda = p_tienda_id)
    and (p_tipo_cliente_id is null or e.id_tipo_cliente = p_tipo_cliente_id)
    and (p_fecha_desde is null or e.fecha_encuesta >= p_fecha_desde)
    and (p_fecha_hasta is null or e.fecha_encuesta <= p_fecha_hasta)
), totales as (
  select
    coalesce(sum(total_venta), 0) as ventas_total,
    coalesce(sum(margen_ganancia), 0) as margen_total,
    coalesce(sum(total_venta) filter (where id_promocion is not null), 0) as ventas_promo,
    coalesce(sum(total_venta) filter (where id_promocion is null), 0) as ventas_sin_promo,
    count(*)::integer as transacciones
  from ventas
), formatos as (
  select formato_promocion as label, round(sum(total_venta), 2) as value,
         round(sum(margen_ganancia), 2) as margen
  from ventas group by formato_promocion
), tendencia as (
  select fecha,
         round(sum(total_venta), 2) as ventas,
         round(sum(total_venta) filter (where id_promocion is not null), 2) as ventas_promo,
         round(sum(total_venta) filter (where id_promocion is null), 2) as ventas_sin_promo,
         round(sum(margen_ganancia), 2) as margen
  from ventas group by fecha order by fecha
), encuesta_kpi as (
  select count(*)::integer as respuestas,
         round(avg(frecuencia_uso_promocion)::numeric, 2) as frecuencia,
         round(avg(aprovechamiento_promocion)::numeric, 2) as aprovechamiento,
         round(
           100 * avg((formato_preferido = '2x1')::integer)
             filter (where edad between 18 and 25),
           1
         ) as preferencia_2x1
  from encuesta
), margen_2x1 as (
  select round(sum(margen_ganancia), 2) as margen,
         round(100 * sum(margen_ganancia) / nullif(sum(total_venta), 0), 1) as porcentaje
  from ventas where formato_promocion = '2x1'
), margen_combo as (
  select round(100 * sum(margen_ganancia) / nullif(sum(total_venta), 0), 1) as porcentaje
  from ventas where formato_promocion = 'Combo'
)
select jsonb_build_object(
  'kpis', jsonb_build_object(
    'ventasPromocion', round(t.ventas_promo, 2),
    'margenImporte', round(t.margen_total, 2),
    'margenPorcentaje', round(100 * t.margen_total / nullif(t.ventas_total, 0), 1),
    'incrementoPorcentaje', round(100 * (t.ventas_promo - t.ventas_sin_promo) / nullif(t.ventas_sin_promo, 0), 1),
    'frecuenciaUso', e.frecuencia,
    'aprovechamiento', e.aprovechamiento,
    'transacciones', t.transacciones,
    'respuestas', e.respuestas
  ),
  'ventasPorFormato', coalesce((select jsonb_agg(to_jsonb(f) order by value desc) from formatos f), '[]'::jsonb),
  'tendencia', coalesce((select jsonb_agg(to_jsonb(x) order by fecha) from tendencia x), '[]'::jsonb),
  'insight2x1', jsonb_build_object(
    'preferenciaPorcentaje', e.preferencia_2x1,
    'margen', m.margen,
    'margenPorcentaje', m.porcentaje,
    'margenComboPorcentaje', c.porcentaje
  )
)
from totales t cross join encuesta_kpi e cross join margen_2x1 m cross join margen_combo c;
$$;

create function public.get_sales(
  p_tienda_id integer default null,
  p_categoria_id integer default null,
  p_campania_id integer default null,
  p_tipo_cliente_id integer default null,
  p_fecha_desde date default null,
  p_fecha_hasta date default null
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
with ventas as (
  select * from public.v_ventas_limpio v
  where (p_tienda_id is null or v.id_tienda = p_tienda_id)
    and (p_categoria_id is null or v.id_categoria = p_categoria_id)
    and (p_campania_id is null or v.id_campania = p_campania_id)
    and (p_tipo_cliente_id is null or v.id_tipo_cliente = p_tipo_cliente_id)
    and (p_fecha_desde is null or v.fecha >= p_fecha_desde)
    and (p_fecha_hasta is null or v.fecha <= p_fecha_hasta)
), tendencia as (
  select fecha, round(sum(total_venta), 2) as ventas, count(*)::integer as transacciones
  from ventas group by fecha order by fecha
), horarios as (
  select franja_horaria as label, count(*)::integer as transacciones,
         round(sum(total_venta), 2) as ventas,
         round(100 * count(*) / nullif(sum(count(*)) over (), 0), 1) as porcentaje
  from ventas group by franja_horaria
), productos as (
  select id_producto, producto, categoria, round(sum(total_venta), 2) as ventas,
         sum(cantidad_vendida)::integer as unidades
  from ventas group by id_producto, producto, categoria order by ventas desc
), categorias as (
  select id_categoria, categoria, round(sum(total_venta), 2) as ventas,
         round(sum(margen_ganancia), 2) as margen,
         round(100 * sum(margen_ganancia) / nullif(sum(total_venta), 0), 1) as margen_porcentaje
  from ventas group by id_categoria, categoria order by ventas desc
), total as (
  select round(coalesce(sum(total_venta), 0), 2) as ventas,
         count(*)::integer as transacciones,
         round(coalesce(avg(total_venta), 0), 2) as ticket,
         round(coalesce(sum(margen_ganancia), 0), 2) as margen
  from ventas
)
select jsonb_build_object(
  'kpis', to_jsonb(total),
  'tendencia', coalesce((select jsonb_agg(to_jsonb(x) order by fecha) from tendencia x), '[]'::jsonb),
  'horarios', coalesce((select jsonb_agg(to_jsonb(x) order by case label when 'Manana' then 1 when 'Tarde' then 2 else 3 end) from horarios x), '[]'::jsonb),
  'productos', coalesce((select jsonb_agg(to_jsonb(x) order by ventas desc) from productos x), '[]'::jsonb),
  'categorias', coalesce((select jsonb_agg(to_jsonb(x) order by ventas desc) from categorias x), '[]'::jsonb)
)
from total;
$$;

create function public.get_promotions(
  p_tienda_id integer default null,
  p_categoria_id integer default null,
  p_campania_id integer default null,
  p_tipo_cliente_id integer default null,
  p_fecha_desde date default null,
  p_fecha_hasta date default null
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
with ventas as (
  select * from public.v_ventas_limpio v
  where (p_tienda_id is null or v.id_tienda = p_tienda_id)
    and (p_categoria_id is null or v.id_categoria = p_categoria_id)
    and (p_campania_id is null or v.id_campania = p_campania_id)
    and (p_tipo_cliente_id is null or v.id_tipo_cliente = p_tipo_cliente_id)
    and (p_fecha_desde is null or v.fecha >= p_fecha_desde)
    and (p_fecha_hasta is null or v.fecha <= p_fecha_hasta)
), formatos as (
  select formato_promocion as formato, count(*)::integer as transacciones,
         round(sum(total_venta), 2) as ventas,
         round(sum(margen_ganancia), 2) as margen,
         round(100 * sum(margen_ganancia) / nullif(sum(total_venta), 0), 1) as margen_porcentaje
  from ventas where id_promocion is not null group by formato_promocion
), detalle as (
  select id_promocion, promocion, formato_promocion as formato, campania,
         count(*)::integer as transacciones, round(sum(total_venta), 2) as ventas,
         round(sum(margen_ganancia), 2) as margen,
         round(100 * sum(margen_ganancia) / nullif(sum(total_venta), 0), 1) as margen_porcentaje
  from ventas where id_promocion is not null
  group by id_promocion, promocion, formato_promocion, campania
), total as (
  select round(coalesce(sum(total_venta), 0), 2) as ventas,
         round(coalesce(sum(margen_ganancia), 0), 2) as margen,
         count(*)::integer as transacciones
  from ventas where id_promocion is not null
)
select jsonb_build_object(
  'kpis', to_jsonb(total),
  'formatos', coalesce((select jsonb_agg(to_jsonb(x) order by ventas desc) from formatos x), '[]'::jsonb),
  'detalle', coalesce((select jsonb_agg(to_jsonb(x) order by ventas desc) from detalle x), '[]'::jsonb)
)
from total;
$$;

create function public.get_customers(
  p_tienda_id integer default null,
  p_categoria_id integer default null,
  p_campania_id integer default null,
  p_tipo_cliente_id integer default null,
  p_fecha_desde date default null,
  p_fecha_hasta date default null
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
with encuesta as (
  select * from public.v_encuesta_limpia e
  where (p_tienda_id is null or e.id_tienda = p_tienda_id)
    and (p_tipo_cliente_id is null or e.id_tipo_cliente = p_tipo_cliente_id)
    and (p_fecha_desde is null or e.fecha_encuesta >= p_fecha_desde)
    and (p_fecha_hasta is null or e.fecha_encuesta <= p_fecha_hasta)
), edades as (
  select rango_edad as label, count(*)::integer as respuestas,
         round(100 * count(*) / nullif(sum(count(*)) over (), 0), 1) as porcentaje
  from encuesta group by rango_edad
), formatos as (
  select formato_preferido as label, count(*)::integer as respuestas,
         round(100 * count(*) / nullif(sum(count(*)) over (), 0), 1) as porcentaje
  from encuesta group by formato_preferido
), horarios as (
  select horario_preferido as label, count(*)::integer as respuestas,
         round(100 * count(*) / nullif(sum(count(*)) over (), 0), 1) as porcentaje
  from encuesta group by horario_preferido
), descriptivos as (
  select count(*)::integer as n,
         round(avg(visitas_semanales)::numeric, 2) as visita_media,
         round(stddev_samp(visitas_semanales)::numeric, 2) as visita_de,
         round(avg(aprovechamiento_promocion)::numeric, 2) as aprovechamiento_media,
         round(stddev_samp(aprovechamiento_promocion)::numeric, 2) as aprovechamiento_de,
         round(avg(atractivo_promociones)::numeric, 2) as atractivo_media,
         round(stddev_samp(atractivo_promociones)::numeric, 2) as atractivo_de,
         round(avg(satisfaccion)::numeric, 2) as satisfaccion_media,
         round(stddev_samp(satisfaccion)::numeric, 2) as satisfaccion_de,
         round(100 * avg(identifica_promociones::integer), 0) as identifica_porcentaje,
         round(100 * avg(percibe_ahorro::integer), 0) as ahorro_porcentaje,
         round(100 * avg((formato_preferido = '2x1')::integer), 0) as prefiere_2x1_porcentaje
  from encuesta where edad between 18 and 25
), total as (
  select count(*)::integer as respuestas,
         min(edad)::integer as edad_minima,
         max(edad)::integer as edad_maxima,
         round(avg(frecuencia_uso_promocion)::numeric, 2) as frecuencia_media
  from encuesta
)
select jsonb_build_object(
  'kpis', to_jsonb(total),
  'edades', coalesce((select jsonb_agg(to_jsonb(x) order by label) from edades x), '[]'::jsonb),
  'formatos', coalesce((select jsonb_agg(to_jsonb(x) order by respuestas desc) from formatos x), '[]'::jsonb),
  'horarios', coalesce((select jsonb_agg(to_jsonb(x) order by respuestas desc) from horarios x), '[]'::jsonb),
  'segmento1825', to_jsonb(descriptivos)
)
from total cross join descriptivos;
$$;

create function public.get_predictive(
  p_tienda_id integer default null,
  p_categoria_id integer default null,
  p_campania_id integer default null,
  p_tipo_cliente_id integer default null,
  p_fecha_desde date default null,
  p_fecha_hasta date default null
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
with filtradas as (
  select pr.*
  from public.prediccion_venta pr
  join public.v_ventas_limpio v on v.id_venta = pr.id_venta
  where pr.id_modelo = 1
    and (p_tienda_id is null or v.id_tienda = p_tienda_id)
    and (p_categoria_id is null or v.id_categoria = p_categoria_id)
    and (p_campania_id is null or v.id_campania = p_campania_id)
    and (p_tipo_cliente_id is null or v.id_tipo_cliente = p_tipo_cliente_id)
    and (p_fecha_desde is null or v.fecha >= p_fecha_desde)
    and (p_fecha_hasta is null or v.fecha <= p_fecha_hasta)
), metricas as (
  select
    count(*)::integer as n,
    case when count(*) > 1 and sum(power(venta_real - avg_real, 2)) > 0
      then 1 - sum(power(venta_real - venta_proyectada, 2)) / sum(power(venta_real - avg_real, 2))
      else null end as r2,
    avg(abs(venta_real - venta_proyectada)) as mae,
    sqrt(avg(power(venta_real - venta_proyectada, 2))) as rmse
  from (
    select f.*, avg(venta_real) over () as avg_real from filtradas f
  ) q
), coeficientes as (
  select variable, orden, coeficiente_original, coeficiente_estandarizado
  from public.coeficiente_modelo where id_modelo = 1 order by orden
), modelo as (
  select * from public.modelo_predictivo where id_modelo = 1
)
select jsonb_build_object(
  'modelo', jsonb_build_object(
    'version', m.version_modelo,
    'algoritmo', m.algoritmo,
    'semilla', m.semilla,
    'entrenamiento', m.filas_entrenamiento,
    'prueba', m.filas_prueba,
    'intercepto', m.intercepto
  ),
  'metricas', jsonb_build_object(
    'n', x.n,
    'r2', round(x.r2::numeric, 4),
    'mae', round(x.mae::numeric, 2),
    'rmse', round(x.rmse::numeric, 2)
  ),
  'coeficientes', coalesce((select jsonb_agg(to_jsonb(c) order by orden) from coeficientes c), '[]'::jsonb),
  'predicciones', coalesce((select jsonb_agg(jsonb_build_object(
      'idVenta', id_venta,
      'real', venta_real,
      'proyectada', round(venta_proyectada, 2),
      'residual', round(residual, 2)
    ) order by id_venta) from filtradas), '[]'::jsonb)
)
from modelo m cross join metricas x;
$$;

-- Superficie controlada para reproducir el entrenamiento sin exponer la vista.
create function public.get_model_features()
returns setof public.v_model_features
language sql
stable
security definer
set search_path = ''
as $$
  select * from public.v_model_features order by id_venta;
$$;

-- -----------------------------------------------------------------------------
-- Seguridad: Data API explicita; tablas y vistas internas no son endpoints
-- -----------------------------------------------------------------------------

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

-- El toggle "Enable automatic RLS" de Supabase crea esta funcion interna como
-- SECURITY DEFINER. El event trigger puede usarla sin exponerla por RPC.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke all on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end $$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'dim_categoria','dim_subcategoria','dim_marca','dim_producto',
    'dim_ciudad','dim_distrito','dim_tienda','dim_tipo_cliente','dim_cliente',
    'dim_tipo_promocion','dim_campania','dim_promocion','dim_tiempo',
    'hecho_ventas','encuesta_clientes','modelo_predictivo','coeficiente_modelo','prediccion_venta'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
  end loop;
end $$;

revoke all on
  public.v_ventas_limpio,
  public.v_encuesta_limpia,
  public."V_Ventas_Limpio",
  public."V_Encuesta_Limpia",
  public.v_kpi_ventas_promocion,
  public.v_kpi_margen_ganancia,
  public.v_kpi_incremento_ventas,
  public.v_kpi_frecuencia_uso_promocion,
  public.v_kpi_rango_edades,
  public.v_kpi_ventas_periodo_horario,
  public.v_ventas_por_formato,
  public.v_margen_por_formato,
  public.v_tendencia_ventas,
  public.v_ventas_por_producto,
  public.v_margen_por_categoria,
  public.v_detalle_promociones,
  public.v_descriptivos_18_25,
  public.v_model_features
from public, anon, authenticated;

revoke all on function public.get_filter_options() from public, anon, authenticated;
revoke all on function public.get_summary(integer,integer,integer,integer,date,date) from public, anon, authenticated;
revoke all on function public.get_sales(integer,integer,integer,integer,date,date) from public, anon, authenticated;
revoke all on function public.get_promotions(integer,integer,integer,integer,date,date) from public, anon, authenticated;
revoke all on function public.get_customers(integer,integer,integer,integer,date,date) from public, anon, authenticated;
revoke all on function public.get_predictive(integer,integer,integer,integer,date,date) from public, anon, authenticated;
revoke all on function public.get_model_features() from public, anon, authenticated;

grant execute on function public.get_filter_options() to anon, authenticated;
grant execute on function public.get_summary(integer,integer,integer,integer,date,date) to anon, authenticated;
grant execute on function public.get_sales(integer,integer,integer,integer,date,date) to anon, authenticated;
grant execute on function public.get_promotions(integer,integer,integer,integer,date,date) to anon, authenticated;
grant execute on function public.get_customers(integer,integer,integer,integer,date,date) to anon, authenticated;
grant execute on function public.get_predictive(integer,integer,integer,integer,date,date) to anon, authenticated;
grant execute on function public.get_model_features() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Pruebas de aceptacion: cualquier desviacion aborta toda la transaccion
-- -----------------------------------------------------------------------------

do $$
declare
  v_count integer;
  v_total numeric;
  v_ticket numeric;
  v_margin numeric;
  v_margin_pct numeric;
  v_morning integer;
  v_afternoon integer;
  v_night integer;
  v_survey integer;
  v_segment integer;
  v_2x1_margin numeric;
  v_rpc_pred integer;
  t text;
  d record;
begin
  select count(*), round(sum(total_venta),2), round(avg(total_venta),2),
         round(sum(margen_ganancia),2),
         round(100 * sum(margen_ganancia) / sum(total_venta),1)
  into v_count, v_total, v_ticket, v_margin, v_margin_pct
  from public.v_ventas_limpio;

  if v_count <> 100 or v_total <> 675.95 or v_ticket <> 6.76
     or v_margin <> 110.15 or v_margin_pct <> 16.3 then
    raise exception 'Validacion financiera fallo: %, %, %, %, %', v_count, v_total, v_ticket, v_margin, v_margin_pct;
  end if;

  select
    count(*) filter (where franja_horaria = 'Manana'),
    count(*) filter (where franja_horaria = 'Tarde'),
    count(*) filter (where franja_horaria = 'Noche')
  into v_morning, v_afternoon, v_night
  from public.v_ventas_limpio;

  if v_morning <> 23 or v_afternoon <> 35 or v_night <> 42 then
    raise exception 'Validacion horaria fallo: %/%/%', v_morning, v_afternoon, v_night;
  end if;

  select count(*), count(*) filter (where edad between 18 and 25)
  into v_survey, v_segment
  from public.v_encuesta_limpia;

  if v_survey <> 50 or v_segment <> 25 then
    raise exception 'Validacion encuesta fallo: % respuestas, % segmento', v_survey, v_segment;
  end if;

  select * into d from public.v_descriptivos_18_25;
  if d.n <> 25 or d.visita_media <> 1.36 or d.visita_de <> 0.99
    or d.aprovechamiento_media <> 1.88 or d.aprovechamiento_de <> 0.93
    or d.atractivo_media <> 2.24 or d.atractivo_de <> 0.72
    or d.satisfaccion_media <> 2.20 or d.satisfaccion_de <> 0.65
    or d.identifica_porcentaje <> 92 or d.ahorro_porcentaje <> 88
    or d.prefiere_2x1_porcentaje <> 84 then
    raise exception 'Validacion descriptivos 18-25 fallo: %', row_to_json(d);
  end if;

  select margen into v_2x1_margin from public.v_margen_por_formato where formato = '2x1';
  if v_2x1_margin <> -18.90 or v_2x1_margin >= 0 then
    raise exception 'El margen 2x1 debe ser -18.90 y negativo; obtenido %', v_2x1_margin;
  end if;

  if (select ventas_promocion from public.v_kpi_ventas_promocion) <> 385.05 then
    raise exception 'Ventas con promocion deben ser 385.05';
  end if;

  if (select incremento_porcentaje from public.v_kpi_incremento_ventas) <> 32.4 then
    raise exception 'Incremento promocional debe ser 32.4%%';
  end if;

  if (select (public.get_summary(null,null,null,null,null,null)->'insight2x1'->>'preferenciaPorcentaje')::numeric) <> 84 then
    raise exception 'La preferencia 2x1 del segmento 18-25 debe ser 84%%';
  end if;

  select jsonb_array_length(public.get_predictive(null,null,null,null,null,null)->'predicciones')
  into v_rpc_pred;
  if v_rpc_pred <> 30
     or (public.get_predictive(null,null,null,null,null,null)->'metricas'->>'n')::integer <> 30 then
    raise exception 'La RPC predictiva debe devolver exactamente 30 observaciones de prueba; obtuvo %', v_rpc_pred;
  end if;

  foreach t in array array[
    'dim_categoria','dim_subcategoria','dim_marca','dim_producto',
    'dim_ciudad','dim_distrito','dim_tienda','dim_tipo_cliente','dim_cliente',
    'dim_tipo_promocion','dim_campania','dim_promocion','dim_tiempo',
    'hecho_ventas','encuesta_clientes','modelo_predictivo','coeficiente_modelo','prediccion_venta'
  ]
  loop
    if has_table_privilege('anon', format('public.%I', t), 'select')
       or has_table_privilege('authenticated', format('public.%I', t), 'select') then
      raise exception 'La tabla % no debe exponer SELECT directo a roles de Data API', t;
    end if;
  end loop;

  if exists (
    select 1 from public.hecho_ventas
    where id_producto is null or id_cliente is null or id_tienda is null or id_tiempo is null
       or total_venta < 0 or costo_total < 0 or descuento_aplicado < 0
  ) then
    raise exception 'Integridad obligatoria o montos invalidos';
  end if;
end $$;

commit;

-- Consulta resumen para la sustentacion:
-- select * from v_kpi_ventas_promocion;
-- select * from v_kpi_margen_ganancia;
-- select * from v_kpi_incremento_ventas;
-- select * from v_kpi_ventas_periodo_horario;
-- select * from v_descriptivos_18_25;
