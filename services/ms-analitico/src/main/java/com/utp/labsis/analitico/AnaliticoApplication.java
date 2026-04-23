package com.utp.labsis.analitico;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

@SpringBootApplication
public class AnaliticoApplication {
    public static void main(String[] args) {
        SpringApplication.run(AnaliticoApplication.class, args);
    }

    @Bean
    WebClient opaClient(@Value("${opa.url}") String opaUrl) {
        return WebClient.builder().baseUrl(opaUrl).build();
    }
}

@Entity
@Table(name = "resultado", schema = "analitico")
class Resultado {
    @Id @GeneratedValue(strategy = GenerationType.UUID) UUID id;
    @Column(name = "muestra_id") UUID muestraId;
    String analito;
    BigDecimal valor;
    String unidad;
    String referencia;
    String estado;
    @Column(name = "validado_por") String validadoPor;
    @Column(name = "trace_id") String traceId;
    @CreationTimestamp @Column(name = "created_at") OffsetDateTime createdAt;

    public UUID getId() { return id; }
    public UUID getMuestraId() { return muestraId; }
    public void setMuestraId(UUID v) { this.muestraId = v; }
    public String getAnalito() { return analito; }
    public void setAnalito(String v) { this.analito = v; }
    public BigDecimal getValor() { return valor; }
    public void setValor(BigDecimal v) { this.valor = v; }
    public String getUnidad() { return unidad; }
    public void setUnidad(String v) { this.unidad = v; }
    public String getReferencia() { return referencia; }
    public void setReferencia(String v) { this.referencia = v; }
    public String getEstado() { return estado; }
    public void setEstado(String v) { this.estado = v; }
    public String getValidadoPor() { return validadoPor; }
    public void setValidadoPor(String v) { this.validadoPor = v; }
    public String getTraceId() { return traceId; }
    public void setTraceId(String v) { this.traceId = v; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}

interface ResultadoRepository extends JpaRepository<Resultado, UUID> {
    List<Resultado> findByMuestraId(UUID muestraId);
    List<Resultado> findByEstado(String estado);
}

@Service
class OpaService {
    private final WebClient opa;
    private final String pkg;
    private final ObjectMapper mapper = new ObjectMapper();

    OpaService(WebClient opaClient, @Value("${opa.package}") String pkg) {
        this.opa = opaClient;
        this.pkg = pkg;
    }

    /**
     * Evalúa la política OPA protegida por los cuatro patrones Resilience4j.
     * Fallback: si OPA no responde o el CB está OPEN, se devuelve "REVISAR" como
     * decisión conservadora (preferimos intervención humana a auto-aprobar).
     */
    @CircuitBreaker(name = "opa", fallbackMethod = "fallback")
    @Retry(name = "opa")
    @Bulkhead(name = "opa")
    public JsonNode evaluar(JsonNode input) {
        JsonNode body = mapper.createObjectNode().set("input", input);
        return opa.post()
            .uri("/v1/data/" + pkg.replace('.', '/'))
            .bodyValue(body)
            .retrieve()
            .bodyToMono(JsonNode.class)
            .block();
    }

    public JsonNode fallback(JsonNode input, Throwable t) {
        return mapper.createObjectNode()
            .put("fallback", true)
            .put("reason", t.getClass().getSimpleName() + ": " + t.getMessage())
            .putPOJO("result", Map.of("decision", "REVISAR", "detalle", List.of()));
    }
}

@Component
class MuestraRecibidaConsumer {
    private final ResultadoRepository repo;
    private final OpaService opa;
    private final ObjectMapper mapper = new ObjectMapper();
    private final Counter cAuto, cRevisar;

    MuestraRecibidaConsumer(ResultadoRepository repo, OpaService opa, MeterRegistry reg) {
        this.repo = repo;
        this.opa = opa;
        this.cAuto = Counter.builder("labsis_analitico_autovalidados_total").register(reg);
        this.cRevisar = Counter.builder("labsis_analitico_revisar_total").register(reg);
    }

    @KafkaListener(topics = "muestra.recibida", groupId = "ms-analitico")
    public void onMuestra(@Payload String payload,
                          @Header(value = "trace_id", required = false) byte[] traceIdBytes) throws Exception {
        String traceId = traceIdBytes != null ? new String(traceIdBytes) : UUID.randomUUID().toString();
        JsonNode msg = mapper.readTree(payload);
        UUID muestraId = UUID.fromString(msg.get("muestra_id").asText());
        JsonNode observaciones = msg.path("observaciones");

        // Construimos el input para OPA: paciente (peso) + resultados
        // Para el MVP-mock se asume peso 3.37 si no hay otro dato.
        JsonNode input = mapper.createObjectNode()
            .<com.fasterxml.jackson.databind.node.ObjectNode>set("paciente",
                mapper.createObjectNode().put("peso_kg", 3.37))
            .set("resultados", observaciones);

        JsonNode opaResp = opa.evaluar(input);
        JsonNode result = opaResp.path("result");
        if (result.isMissingNode()) result = opaResp.path("result").path("result"); // OPA v1/data wrap
        String decision = result.path("decision").asText("REVISAR");

        JsonNode detalle = result.path("detalle");
        if (detalle.isArray() && detalle.size() > 0) {
            for (JsonNode d : detalle) persistResultado(muestraId, d, traceId);
        } else if (observaciones.isArray()) {
            for (JsonNode o : observaciones) persistResultadoFromObs(muestraId, o, decision, traceId);
        }
        if ("AUTOVALIDADO".equals(decision)) cAuto.increment(); else cRevisar.increment();
    }

    private void persistResultado(UUID muestraId, JsonNode d, String traceId) {
        Resultado r = new Resultado();
        r.setMuestraId(muestraId);
        r.setAnalito(d.path("analito").asText());
        r.setValor(BigDecimal.valueOf(d.path("valor").asDouble()));
        r.setUnidad(d.path("unidad").asText(""));
        r.setReferencia(d.path("referencia").asText(""));
        r.setEstado(d.path("estado").asText("REVISAR"));
        r.setValidadoPor("OPA-RULES");
        r.setTraceId(traceId);
        repo.save(r);
    }

    private void persistResultadoFromObs(UUID muestraId, JsonNode o, String decisionGlobal, String traceId) {
        Resultado r = new Resultado();
        r.setMuestraId(muestraId);
        r.setAnalito(o.path("analito").asText());
        r.setValor(BigDecimal.valueOf(o.path("valor").asDouble()));
        r.setUnidad(o.path("unidad").asText(""));
        r.setEstado(decisionGlobal);
        r.setValidadoPor("FALLBACK");
        r.setTraceId(traceId);
        repo.save(r);
    }
}

@RestController
@RequestMapping("/resultados")
class ResultadoController {
    private final ResultadoRepository repo;

    ResultadoController(ResultadoRepository repo) { this.repo = repo; }

    @GetMapping
    public List<Resultado> list(@RequestParam(required = false) String estado) {
        return estado != null ? repo.findByEstado(estado) : repo.findAll();
    }

    @GetMapping("/by-muestra/{id}")
    public List<Resultado> byMuestra(@PathVariable UUID id) {
        return repo.findByMuestraId(id);
    }
}
