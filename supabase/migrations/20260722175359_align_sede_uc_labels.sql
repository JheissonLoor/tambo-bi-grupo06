-- Alinea los tres puntos de atención con el alcance académico de la sede UC.
-- No modifica identificadores ni hechos, por lo que las métricas permanecen intactas.
update public.dim_tienda
set nombre_tienda = case id_tienda
  when 1 then 'UC · Av. Universitaria'
  when 2 then 'UC · Puerta 3'
  when 3 then 'UC · Óvalo'
end,
codigo_tienda = case id_tienda
  when 1 then 'UC-AVU-01'
  when 2 then 'UC-P03-02'
  when 3 then 'UC-OVA-03'
end
where id_tienda in (1, 2, 3);

do $$
begin
  if (select count(*) from public.dim_tienda where nombre_tienda like 'UC · %') <> 3 then
    raise exception 'No se pudieron alinear los tres puntos de atención de la sede UC';
  end if;
end
$$;
