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

-- Prueba manual de permisos (debe fallar con 42501):
-- begin;
-- set local role anon;
-- insert into public.dim_categoria values (999, 'NO DEBE INSERTAR');
-- rollback;
