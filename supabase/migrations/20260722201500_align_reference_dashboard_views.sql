-- Amplía las RPC del tablero para reproducir las vistas aprobadas de
-- Promociones y Clientes sin perder filtros ni trazabilidad al DataMart.

create or replace function public.get_promotions(
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
         string_agg(distinct categoria, ', ' order by categoria) as categoria,
         string_agg(distinct marca, ', ' order by marca) as marca,
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

create or replace function public.get_customers(
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
), generos as (
  select initcap(genero) as label, count(*)::integer as respuestas,
         round(100 * count(*) / nullif(sum(count(*)) over (), 0), 1) as porcentaje
  from encuesta group by initcap(genero)
), niveles(nivel) as (
  values (0), (1), (2), (3)
), frecuencia_uso as (
  select n.nivel,
         count(e.id_encuesta)::integer as respuestas,
         round(100 * count(e.id_encuesta) / nullif((select count(*) from encuesta where edad between 18 and 25), 0), 1) as porcentaje
  from niveles n
  left join encuesta e on e.edad between 18 and 25 and e.frecuencia_uso_promocion = n.nivel
  group by n.nivel
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
  'generos', coalesce((select jsonb_agg(to_jsonb(x) order by case when label = 'Femenino' then 0 else 1 end, label) from generos x), '[]'::jsonb),
  'frecuenciaUso', coalesce((select jsonb_agg(to_jsonb(x) order by nivel) from frecuencia_uso x), '[]'::jsonb),
  'formatos', coalesce((select jsonb_agg(to_jsonb(x) order by respuestas desc) from formatos x), '[]'::jsonb),
  'horarios', coalesce((select jsonb_agg(to_jsonb(x) order by respuestas desc) from horarios x), '[]'::jsonb),
  'segmento1825', to_jsonb(descriptivos)
)
from total cross join descriptivos;
$$;
