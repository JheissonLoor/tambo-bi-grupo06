-- Consultas reproducibles para validar la sustentacion del DataMart Tambo.

select
  count(*) as transacciones,
  round(sum(total_venta), 2) as ventas,
  round(avg(total_venta), 2) as ticket_promedio,
  round(sum(margen_ganancia), 2) as margen,
  round(100 * sum(margen_ganancia) / sum(total_venta), 1) as margen_porcentaje
from public.v_ventas_limpio;

select *
from public.v_kpi_ventas_periodo_horario
order by case franja_horaria when 'Manana' then 1 when 'Tarde' then 2 else 3 end;

select *
from public.v_margen_por_formato
order by ventas desc;

select * from public.v_kpi_incremento_ventas;
select * from public.v_descriptivos_18_25;

select
  (select count(*) from public.hecho_ventas) as ventas,
  (select count(*) from public.encuesta_clientes) as encuestas,
  (select count(*) from public.prediccion_venta) as predicciones,
  (select count(*) from public.coeficiente_modelo) as coeficientes;

select
  jsonb_array_length(public.get_predictive(null,null,null,null,null,null)->'predicciones') as predicciones_rpc,
  (public.get_predictive(null,null,null,null,null,null)->'metricas'->>'n')::integer as n_prueba_rpc;

select
  has_table_privilege('anon', 'public.hecho_ventas', 'select') as anon_lee_hecho,
  has_table_privilege('anon', 'public.encuesta_clientes', 'select') as anon_lee_encuesta,
  has_function_privilege('anon', 'public.get_summary(integer,integer,integer,integer,date,date)', 'execute') as anon_ejecuta_resumen;

-- Pruebas manuales de permisos (la primera funciona; la segunda falla con 42501):
-- begin;
-- set local role anon;
-- select public.get_summary(null,null,null,null,null,null);
-- select * from public.hecho_ventas;
-- rollback;
--
-- begin;
-- set local role anon;
-- insert into public.dim_categoria values (999, 'NO DEBE INSERTAR');
-- rollback;
