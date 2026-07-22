#!/usr/bin/env python3
"""Entrena y serializa la regresion lineal del DataMart Tambo.

Por defecto usa el fixture deterministico de 100 ventas que tambien se genera en
supabase/001_datamart_tambo.sql. Con --supabase ejecuta la RPC de solo lectura
get_model_features. No escribe en Supabase: imprime JSON o SQL para que el resultado
pueda revisarse y versionarse.
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import math
import os
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


SEED = 42
FEATURES = (
    "porcentaje_descuento",
    "codigo_tipo_promocion",
    "codigo_categoria",
    "es_fin_semana",
    "codigo_franja_horaria",
    "edad_cliente",
)


@dataclass(frozen=True)
class Row:
    id_venta: int
    target: float
    values: tuple[float, ...]


def load_env(path: Path) -> None:
    if not path.exists():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def sale_cents(group_start: int, n: int, total_cents: int, position: int) -> int:
    del group_start
    return total_cents // n + (1 if position <= total_cents % n else 0)


def fixture_rows() -> list[Row]:
    groups = (
        (1, 28, 22410),
        (29, 8, 6000),
        (37, 8, 5000),
        (45, 6, 2800),
        (51, 5, 2295),
        (56, 45, 29090),
    )
    product_categories = {1: 1, 2: 2, 3: 3, 4: 2, 5: 4, 6: 1, 7: 5, 8: 1}
    rows: list[Row] = []

    for start, count, total in groups:
        for position in range(1, count + 1):
            sale_id = start + position - 1
            if start == 1:
                product = (1, 4, 8)[(position - 1) % 3]
                discount, promo_type = 50.0, 1.0
            elif start == 29:
                product = (2, 6)[(position - 1) % 2]
                discount = (20.0, 18.0)[(position - 1) % 2]
                promo_type = 2.0
            elif start == 37:
                product, discount, promo_type = 3, 25.0, 3.0
            elif start == 45:
                product, discount, promo_type = 5, 0.0, 4.0
            elif start == 51:
                product, discount, promo_type = 7, 15.0, 5.0
            else:
                product = 1 + ((sale_id - 1) % 8)
                discount, promo_type = 0.0, 0.0

            date = dt.date(2026, 6, 1) + dt.timedelta(days=(sale_id - 1) % 30)
            client_id = 1 + ((sale_id - 1) % 50)
            age = 18 + ((client_id - 1) % 8) if client_id <= 25 else 26 + ((client_id - 26) % 25)
            time_band = 0.0 if sale_id <= 23 else (1.0 if sale_id <= 58 else 2.0)
            rows.append(
                Row(
                    sale_id,
                    sale_cents(start, count, total, position) / 100.0,
                    (
                        discount,
                        promo_type,
                        float(product_categories[product]),
                        float(date.weekday() >= 5),
                        time_band,
                        float(age),
                    ),
                )
            )
    return rows


def supabase_rows() -> list[Row]:
    url = os.environ.get("VITE_SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY", "")
    if not url or not key:
        raise SystemExit("Faltan VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY")
    request = urllib.request.Request(
        f"{url}/rest/v1/rpc/get_model_features",
        data=b"{}",
        headers={"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        payload = json.load(response)
    return [
        Row(
            int(item["id_venta"]),
            float(item["objetivo_venta"]),
            tuple(float(item[name]) for name in FEATURES),
        )
        for item in payload
    ]


def transpose(matrix: list[list[float]]) -> list[list[float]]:
    return [list(column) for column in zip(*matrix)]


def matmul(left: list[list[float]], right: list[list[float]]) -> list[list[float]]:
    right_t = transpose(right)
    return [[sum(a * b for a, b in zip(row, column)) for column in right_t] for row in left]


def inverse(matrix: list[list[float]]) -> list[list[float]]:
    size = len(matrix)
    augmented = [row[:] + [float(i == j) for j in range(size)] for i, row in enumerate(matrix)]
    for column in range(size):
        pivot = max(range(column, size), key=lambda row: abs(augmented[row][column]))
        if abs(augmented[pivot][column]) < 1e-12:
            raise ValueError("La matriz de diseno es singular")
        augmented[column], augmented[pivot] = augmented[pivot], augmented[column]
        divisor = augmented[column][column]
        augmented[column] = [value / divisor for value in augmented[column]]
        for row in range(size):
            if row == column:
                continue
            factor = augmented[row][column]
            augmented[row] = [
                value - factor * pivot_value
                for value, pivot_value in zip(augmented[row], augmented[column])
            ]
    return [row[size:] for row in augmented]


def solve_ols(rows: list[Row]) -> list[float]:
    design = [[1.0, *row.values] for row in rows]
    target = [[row.target] for row in rows]
    design_t = transpose(design)
    coefficients = matmul(matmul(inverse(matmul(design_t, design)), design_t), target)
    return [item[0] for item in coefficients]


def predict(row: Row, coefficients: list[float]) -> float:
    return coefficients[0] + sum(coef * value for coef, value in zip(coefficients[1:], row.values))


def mean(values: Iterable[float]) -> float:
    values = list(values)
    return sum(values) / len(values)


def population_sd(values: Iterable[float]) -> float:
    values = list(values)
    average = mean(values)
    return math.sqrt(sum((value - average) ** 2 for value in values) / len(values))


def train(rows: list[Row]) -> dict[str, object]:
    if len(rows) != 100:
        raise ValueError(f"Se esperaban 100 ventas y se recibieron {len(rows)}")
    ordered = sorted(
        rows,
        key=lambda row: hashlib.sha256(f"{SEED}:{row.id_venta}".encode("ascii")).hexdigest(),
    )
    training, test = ordered[:70], ordered[70:]
    coefficients = solve_ols(training)
    predictions = [(row, predict(row, coefficients)) for row in test]
    actual_average = mean(row.target for row in test)
    squared_error = sum((row.target - projected) ** 2 for row, projected in predictions)
    total_variance = sum((row.target - actual_average) ** 2 for row in test)
    r2 = 1.0 - squared_error / total_variance
    mae = mean(abs(row.target - projected) for row, projected in predictions)
    rmse = math.sqrt(mean((row.target - projected) ** 2 for row, projected in predictions))
    target_sd = population_sd(row.target for row in training)
    standardized = []
    for index, coefficient in enumerate(coefficients[1:]):
        feature_sd = population_sd(row.values[index] for row in training)
        standardized.append(0.0 if target_sd == 0 else coefficient * feature_sd / target_sd)

    return {
        "model": {
            "id": 1,
            "version": "tambo-lm-v1-seed42",
            "algorithm": "Regresion lineal multiple OLS",
            "seed": SEED,
            "training": len(training),
            "test": len(test),
            "r2": r2,
            "mae": mae,
            "rmse": rmse,
            "intercept": coefficients[0],
        },
        "coefficients": [
            {
                "variable": name,
                "order": index + 1,
                "original": coefficients[index + 1],
                "standardized": standardized[index],
            }
            for index, name in enumerate(FEATURES)
        ],
        "predictions": [
            {"id_sale": row.id_venta, "actual": row.target, "projected": projected}
            for row, projected in sorted(predictions, key=lambda pair: pair[0].id_venta)
        ],
    }


def sql_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def emit_sql(result: dict[str, object]) -> str:
    model = result["model"]
    assert isinstance(model, dict)
    lines = [
        "insert into public.modelo_predictivo (id_modelo, version_modelo, algoritmo, semilla, porcentaje_entrenamiento, filas_entrenamiento, filas_prueba, r2, mae, rmse, intercepto, entrenado_en) values",
        "  ({id}, {version}, {algorithm}, {seed}, 70.00, {training}, {test}, {r2:.10f}, {mae:.10f}, {rmse:.10f}, {intercept:.10f}, timestamptz '2026-06-30 23:59:00-05');".format(
            id=model["id"],
            version=sql_literal(str(model["version"])),
            algorithm=sql_literal(str(model["algorithm"])),
            seed=model["seed"],
            training=model["training"],
            test=model["test"],
            r2=model["r2"],
            mae=model["mae"],
            rmse=model["rmse"],
            intercept=model["intercept"],
        ),
        "",
        "insert into public.coeficiente_modelo (id_modelo, variable, orden, coeficiente_original, coeficiente_estandarizado) values",
    ]
    coefficients = result["coefficients"]
    assert isinstance(coefficients, list)
    for index, item in enumerate(coefficients):
        suffix = "," if index < len(coefficients) - 1 else ";"
        lines.append(
            "  (1, {variable}, {order}, {original:.10f}, {standardized:.10f}){suffix}".format(
                variable=sql_literal(str(item["variable"])),
                order=item["order"],
                original=item["original"],
                standardized=item["standardized"],
                suffix=suffix,
            )
        )
    lines.extend([
        "",
        "insert into public.prediccion_venta (id_modelo, id_venta, conjunto, venta_real, venta_proyectada) values",
    ])
    predictions = result["predictions"]
    assert isinstance(predictions, list)
    for index, item in enumerate(predictions):
        suffix = "," if index < len(predictions) - 1 else ";"
        lines.append(
            "  (1, {id_sale}, 'prueba', {actual:.2f}, {projected:.6f}){suffix}".format(
                id_sale=item["id_sale"],
                actual=item["actual"],
                projected=item["projected"],
                suffix=suffix,
            )
        )
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--supabase", action="store_true", help="Leer v_model_features desde Supabase")
    parser.add_argument("--format", choices=("json", "sql"), default="json")
    args = parser.parse_args()
    load_env(Path(__file__).resolve().parents[1] / ".env.local")
    result = train(supabase_rows() if args.supabase else fixture_rows())
    if args.format == "sql":
        print(emit_sql(result))
    else:
        print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
