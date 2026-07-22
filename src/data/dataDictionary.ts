export type DictionaryColumn = {
  name: string;
  type: string;
  key?: "PK" | "FK" | "PK/FK";
  nullable?: boolean;
  description: string;
};

export type DictionaryTable = {
  name: string;
  group: "Modelo comercial" | "Encuesta" | "Modelo analítico";
  purpose: string;
  columns: DictionaryColumn[];
};

const c = (name: string, type: string, description: string, key?: DictionaryColumn["key"], nullable = false): DictionaryColumn => ({ name, type, description, key, nullable });

export const dataDictionary: DictionaryTable[] = [
  { name: "dim_categoria", group: "Modelo comercial", purpose: "Clasifica el nivel superior del catálogo de productos.", columns: [
    c("id_categoria", "integer", "Identificador único de categoría.", "PK"), c("nombre_categoria", "text", "Nombre normalizado y único de la categoría."),
  ] },
  { name: "dim_subcategoria", group: "Modelo comercial", purpose: "Normaliza la jerarquía entre producto y categoría.", columns: [
    c("id_subcategoria", "integer", "Identificador único de subcategoría.", "PK"), c("id_categoria", "integer", "Categoría a la que pertenece.", "FK"), c("nombre_subcategoria", "text", "Nombre de la subcategoría dentro de su categoría."),
  ] },
  { name: "dim_marca", group: "Modelo comercial", purpose: "Catálogo de marcas de producto.", columns: [
    c("id_marca", "integer", "Identificador único de marca.", "PK"), c("nombre_marca", "text", "Nombre único de la marca."),
  ] },
  { name: "dim_producto", group: "Modelo comercial", purpose: "Describe los productos vendidos y su clasificación.", columns: [
    c("id_producto", "integer", "Identificador único de producto.", "PK"), c("id_subcategoria", "integer", "Subcategoría del producto.", "FK"), c("id_marca", "integer", "Marca del producto.", "FK"), c("nombre_producto", "text", "Nombre único del producto."), c("unidad_medida", "text", "Unidad comercial; por defecto, unidad."), c("precio_referencia", "numeric(10,2)", "Precio de referencia no negativo."),
  ] },
  { name: "dim_ciudad", group: "Modelo comercial", purpose: "Nivel superior de la jerarquía geográfica.", columns: [
    c("id_ciudad", "integer", "Identificador único de ciudad.", "PK"), c("nombre_ciudad", "text", "Nombre único de la ciudad."),
  ] },
  { name: "dim_distrito", group: "Modelo comercial", purpose: "Relaciona los distritos con su ciudad.", columns: [
    c("id_distrito", "integer", "Identificador único de distrito.", "PK"), c("id_ciudad", "integer", "Ciudad a la que pertenece.", "FK"), c("nombre_distrito", "text", "Nombre del distrito dentro de la ciudad."),
  ] },
  { name: "dim_tienda", group: "Modelo comercial", purpose: "Catálogo de sedes comerciales.", columns: [
    c("id_tienda", "integer", "Identificador único de tienda.", "PK"), c("id_distrito", "integer", "Distrito de la sede.", "FK"), c("nombre_tienda", "text", "Nombre único de la sede."), c("codigo_tienda", "text", "Código operativo único."),
  ] },
  { name: "dim_tipo_cliente", group: "Modelo comercial", purpose: "Segmenta clientes por tipo académico.", columns: [
    c("id_tipo_cliente", "integer", "Identificador único del tipo.", "PK"), c("nombre_tipo_cliente", "text", "Nombre único del segmento."),
  ] },
  { name: "dim_cliente", group: "Modelo comercial", purpose: "Cliente sintético sin información de identificación personal.", columns: [
    c("id_cliente", "integer", "Identificador sintético del cliente.", "PK"), c("id_tipo_cliente", "integer", "Segmento del cliente.", "FK"), c("edad", "integer", "Edad simulada entre 16 y 80 años."), c("genero", "text", "Categoría declarada dentro del catálogo permitido."),
  ] },
  { name: "dim_tipo_promocion", group: "Modelo comercial", purpose: "Catálogo de formatos promocionales.", columns: [
    c("id_tipo_promocion", "integer", "Identificador único del formato.", "PK"), c("nombre_tipo_promocion", "text", "Nombre único del formato."), c("codigo_modelo", "integer", "Codificación numérica usada en la validación técnica."),
  ] },
  { name: "dim_campania", group: "Modelo comercial", purpose: "Define campañas y su vigencia.", columns: [
    c("id_campania", "integer", "Identificador único de campaña.", "PK"), c("nombre_campania", "text", "Nombre único de campaña."), c("fecha_inicio", "date", "Inicio de la campaña."), c("fecha_fin", "date", "Fin igual o posterior al inicio."),
  ] },
  { name: "dim_promocion", group: "Modelo comercial", purpose: "Describe cada promoción y enlaza formato con campaña.", columns: [
    c("id_promocion", "integer", "Identificador único de promoción.", "PK"), c("id_tipo_promocion", "integer", "Formato promocional.", "FK"), c("id_campania", "integer", "Campaña asociada.", "FK"), c("nombre_promocion", "text", "Nombre único de la promoción."), c("porcentaje_descuento", "numeric(5,2)", "Descuento entre 0% y 100%."), c("fecha_inicio", "date", "Inicio de vigencia."), c("fecha_fin", "date", "Fin de vigencia."), c("activa", "boolean", "Indica si la promoción está activa."),
  ] },
  { name: "dim_tiempo", group: "Modelo comercial", purpose: "Dimensión calendario para el análisis temporal.", columns: [
    c("id_tiempo", "integer", "Clave sustituta de fecha.", "PK"), c("fecha", "date", "Fecha calendario única."), c("dia", "smallint", "Día del mes."), c("mes", "smallint", "Número de mes."), c("nombre_mes", "text", "Nombre del mes."), c("trimestre", "smallint", "Trimestre entre 1 y 4."), c("anio", "smallint", "Año calendario."), c("dia_semana", "text", "Nombre del día."), c("es_fin_semana", "boolean", "Marca sábado o domingo."),
  ] },
  { name: "hecho_ventas", group: "Modelo comercial", purpose: "Tabla central: una fila por transacción de venta.", columns: [
    c("id_venta", "integer", "Identificador único de la transacción.", "PK"), c("id_producto", "integer", "Producto vendido.", "FK"), c("id_cliente", "integer", "Cliente sintético.", "FK"), c("id_tienda", "integer", "Sede de la venta.", "FK"), c("id_promocion", "integer", "Promoción aplicada; nulo si no hubo promoción.", "FK", true), c("id_tiempo", "integer", "Fecha de la venta.", "FK"), c("hora_venta", "time", "Hora exacta simulada."), c("cantidad_vendida", "integer", "Unidades positivas vendidas."), c("total_venta", "numeric(10,2)", "Importe final no negativo."), c("costo_total", "numeric(10,2)", "Costo asociado no negativo."), c("descuento_aplicado", "numeric(10,2)", "Importe de descuento no negativo."), c("margen_ganancia", "numeric(10,2)", "Columna calculada: venta menos costo."),
  ] },
  { name: "encuesta_clientes", group: "Encuesta", purpose: "50 respuestas sintéticas y anónimas sobre uso y percepción de promociones.", columns: [
    c("id_encuesta", "integer", "Identificador de respuesta.", "PK"), c("id_tipo_cliente", "integer", "Segmento declarado.", "FK"), c("id_tienda", "integer", "Sede asociada.", "FK"), c("fecha_encuesta", "date", "Fecha de respuesta."), c("edad", "integer", "Edad simulada entre 16 y 80."), c("genero", "text", "Categoría declarada."), c("visitas_semanales", "integer", "Visitas declaradas entre 0 y 7."), c("frecuencia_uso_promocion", "integer", "Frecuencia declarada en escala 0–3."), c("aprovechamiento_promocion", "integer", "Aprovechamiento declarado en escala 0–3."), c("atractivo_promociones", "integer", "Atractivo percibido en escala 1–3."), c("satisfaccion", "integer", "Satisfacción en escala 1–3."), c("identifica_promociones", "boolean", "Reconoce las promociones."), c("percibe_ahorro", "boolean", "Declara percibir ahorro."), c("formato_preferido", "text", "Formato promocional preferido."), c("horario_preferido", "text", "Mañana, tarde o noche."),
  ] },
  { name: "modelo_predictivo", group: "Modelo analítico", purpose: "Metadatos y métricas de la validación técnica reproducible.", columns: [
    c("id_modelo", "integer", "Identificador de la versión.", "PK"), c("version_modelo", "text", "Etiqueta única de versión."), c("algoritmo", "text", "Algoritmo utilizado."), c("semilla", "integer", "Semilla de partición reproducible."), c("porcentaje_entrenamiento", "numeric(5,2)", "Porcentaje usado para entrenamiento."), c("filas_entrenamiento", "integer", "Número de ventas de entrenamiento."), c("filas_prueba", "integer", "Número de ventas de prueba."), c("r2", "numeric(12,8)", "Coeficiente de determinación técnico."), c("mae", "numeric(12,8)", "Error absoluto medio."), c("rmse", "numeric(12,8)", "Raíz del error cuadrático medio."), c("intercepto", "numeric(18,10)", "Constante de la regresión."), c("entrenado_en", "timestamptz", "Marca temporal reproducible del entrenamiento."),
  ] },
  { name: "coeficiente_modelo", group: "Modelo analítico", purpose: "Coeficientes originales y estandarizados por variable.", columns: [
    c("id_modelo", "integer", "Versión del modelo.", "PK/FK"), c("variable", "text", "Nombre de la variable explicativa.", "PK"), c("orden", "integer", "Orden de presentación."), c("coeficiente_original", "numeric(18,10)", "Coeficiente en escala original."), c("coeficiente_estandarizado", "numeric(18,10)", "Coeficiente comparable por escala."),
  ] },
  { name: "prediccion_venta", group: "Modelo analítico", purpose: "30 observaciones del conjunto de prueba de la validación técnica.", columns: [
    c("id_modelo", "integer", "Versión del modelo.", "PK/FK"), c("id_venta", "integer", "Venta evaluada.", "PK/FK"), c("conjunto", "text", "Etiqueta controlada: prueba."), c("venta_real", "numeric(10,2)", "Importe observado en el dato sintético."), c("venta_proyectada", "numeric(12,6)", "Importe estimado por el modelo."), c("residual", "numeric(12,6)", "Columna calculada: real menos proyectada."),
  ] },
];
