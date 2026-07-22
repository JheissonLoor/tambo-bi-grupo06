import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("la navegación publica las 12 páginas documentadas", async () => {
  const app = await read("src/App.tsx");
  const routes = [...app.matchAll(/^\s*\["([^"]+)",\s*\w+\],?$/gm)].map((match) => match[1]);
  assert.equal(routes.length, 12);
  assert.ok(routes.includes("diccionario"));
  assert.ok(routes.includes("power-bi"));
});

test("el diccionario cubre las 18 tablas físicas", async () => {
  const dictionary = await read("src/data/dataDictionary.ts");
  const tables = [...dictionary.matchAll(/\{ name: "([a-z_]+)", group:/g)].map((match) => match[1]);
  assert.equal(tables.length, 18);
  assert.equal(new Set(tables).size, 18);
  assert.ok(tables.includes("hecho_ventas"));
  assert.ok(tables.includes("encuesta_clientes"));
  assert.ok(tables.includes("prediccion_venta"));
});

test("la Data API expone RPC y no concede SELECT directo a tablas", async () => {
  const sql = await read("supabase/001_datamart_tambo.sql");
  assert.doesNotMatch(sql, /grant select on table public\.%I to anon/i);
  assert.doesNotMatch(sql, /create policy "lectura_publica"/i);
  assert.match(sql, /create function public\.get_model_features\(\)/i);
  assert.match(sql, /security definer\s+set search_path = ''/i);
  assert.match(sql, /grant execute on function public\.get_predictive/i);
});

test("la aceptación fija 30 predicciones para el conjunto de prueba", async () => {
  const sql = await read("supabase/001_datamart_tambo.sql");
  assert.match(sql, /v_rpc_pred <> 30/);
  assert.match(sql, /'metricas'->>'n'\)::integer <> 30/);
});

test("la sede UC conserva sus tres puntos de atención en todo despliegue", async () => {
  const sql = await read("supabase/001_datamart_tambo.sql");
  assert.match(sql, /UC · Av\. Universitaria/);
  assert.match(sql, /UC · Puerta 3/);
  assert.match(sql, /UC · Óvalo/);
  assert.doesNotMatch(sql, /'Tambo (Centro|Lince|UC)'/);
});

test("el diagrama visualiza las 14 tablas y sus 13 relaciones comerciales", async () => {
  const diagram = await read("src/components/SnowflakeDiagram.tsx");
  const nodeBlock = diagram.slice(diagram.indexOf("const nodes"), diagram.indexOf("const edges"));
  const edgeBlock = diagram.slice(diagram.indexOf("const edges"), diagram.indexOf("const nodeMap"));
  assert.equal([...nodeBlock.matchAll(/\{ id: "/g)].length, 14);
  assert.equal([...edgeBlock.matchAll(/^\s*\["[a-z_]+", "[a-z_]+"\],?$/gm)].length, 13);
});

test("la migración desplegable coincide con el SQL operativo", async () => {
  const files = await readdir(new URL("../supabase/migrations", import.meta.url));
  const migrations = files.filter((file) => file.endsWith("_datamart_tambo.sql"));
  assert.equal(migrations.length, 1);
  const [operational, migration] = await Promise.all([
    read("supabase/001_datamart_tambo.sql"),
    read(`supabase/migrations/${migrations[0]}`),
  ]);
  assert.equal(migration, operational);
});
