package labsis.autovalidacion

# Reglas de autovalidación para el panel de Tamizaje Neonatal.
# Panel: IRT, TSH, G6PD, NEOPHE, OHP17, TGAL.
# Rangos tomados del entorno Labsis observado en pantalla (HJRE).
#
# Entrada esperada:
# {
#   "paciente": { "peso_kg": 3.37 },
#   "resultados": [
#     {"analito":"IRT", "valor": 12.8, "unidad":"ng/mL"},
#     {"analito":"TSH", "valor": 3.10, "unidad":"uU/mL"},
#     ...
#   ]
# }
#
# Salida: {"decision":"AUTOVALIDADO"|"REVISAR", "detalle":[{analito, estado, referencia}]}

default decision := "AUTOVALIDADO"

# Disparador: si algún analito no queda NEGATIVO, pasar a REVISAR
decision := "REVISAR" {
  some i
  r := input.resultados[i]
  estado_de(r, input.paciente.peso_kg) == "REVISAR"
}

# Detalle por cada analito
detalle[item] {
  some i
  r := input.resultados[i]
  estado := estado_de(r, input.paciente.peso_kg)
  item := {
    "analito":    r.analito,
    "valor":      r.valor,
    "unidad":     r.unidad,
    "estado":     estado,
    "referencia": referencia_de(r, input.paciente.peso_kg),
  }
}

# ---------------- Reglas por analito ----------------

estado_de(r, _) = "AUTOVALIDADO" {
  r.analito == "IRT"
  r.valor < 65
}
estado_de(r, _) = "REVISAR" {
  r.analito == "IRT"
  r.valor >= 65
}
referencia_de(r, _) = "< 65 (Negativo)" { r.analito == "IRT" }

estado_de(r, _) = "AUTOVALIDADO" {
  r.analito == "TSH"
  r.valor <= 14.0
}
estado_de(r, _) = "REVISAR" {
  r.analito == "TSH"
  r.valor > 14.0
}
referencia_de(r, _) = "<= 14.0 (Negativo)" { r.analito == "TSH" }

estado_de(r, _) = "AUTOVALIDADO" {
  r.analito == "G6PD"
  r.valor > 24
}
estado_de(r, _) = "REVISAR" {
  r.analito == "G6PD"
  r.valor <= 24
}
referencia_de(r, _) = "> 24 (Negativo)" { r.analito == "G6PD" }

estado_de(r, _) = "AUTOVALIDADO" {
  r.analito == "NEOPHE"
  r.valor < 2.4
}
estado_de(r, _) = "REVISAR" {
  r.analito == "NEOPHE"
  r.valor >= 2.4
}
referencia_de(r, _) = "< 2.4 (Negativo)" { r.analito == "NEOPHE" }

# --- 17-OHP: DEPENDIENTE DEL PESO ---
# < 2.5 kg : corte <= 73 (Negativo); >= 2.5 kg : corte <= 10.6 (Negativo)
estado_de(r, peso) = "AUTOVALIDADO" {
  r.analito == "OHP17"
  peso < 2.5
  r.valor <= 73
}
estado_de(r, peso) = "REVISAR" {
  r.analito == "OHP17"
  peso < 2.5
  r.valor > 73
}
estado_de(r, peso) = "AUTOVALIDADO" {
  r.analito == "OHP17"
  peso >= 2.5
  r.valor <= 10.6
}
estado_de(r, peso) = "REVISAR" {
  r.analito == "OHP17"
  peso >= 2.5
  r.valor > 10.6
}
referencia_de(r, peso) = "< 2.5 kg: <= 73 Negativo" {
  r.analito == "OHP17"
  peso < 2.5
}
referencia_de(r, peso) = ">= 2.5 kg: <= 10.6 Negativo" {
  r.analito == "OHP17"
  peso >= 2.5
}

estado_de(r, _) = "AUTOVALIDADO" {
  r.analito == "TGAL"
  r.valor < 10.8
}
estado_de(r, _) = "REVISAR" {
  r.analito == "TGAL"
  r.valor >= 10.8
}
referencia_de(r, _) = "< 10.8 (Negativo)" { r.analito == "TGAL" }
