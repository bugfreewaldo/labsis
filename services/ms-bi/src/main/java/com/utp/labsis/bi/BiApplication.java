package com.utp.labsis.bi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@SpringBootApplication
public class BiApplication {
    public static void main(String[] args) {
        SpringApplication.run(BiApplication.class, args);
    }
}

@RestController
@RequestMapping("/indicadores")
class IndicadoresController {
    private final JdbcTemplate jdbc;

    IndicadoresController(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    /** Devuelve la vista materializada/indicadores directamente desde el standby. */
    @GetMapping
    public List<Map<String, Object>> indicadores() {
        return jdbc.queryForList("SELECT * FROM analitico.v_indicadores");
    }

    @GetMapping("/resumen")
    public Map<String, Object> resumen() {
        return jdbc.queryForMap("""
            SELECT
              COUNT(*) AS total,
              COUNT(*) FILTER (WHERE estado = 'AUTOVALIDADO') AS autovalidados,
              COUNT(*) FILTER (WHERE estado = 'REVISAR')      AS a_revisar,
              COUNT(*) FILTER (WHERE estado = 'RECHAZADO')    AS rechazados
            FROM analitico.resultado
        """);
    }
}
