package com.utp.labsis.muestras;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.*;

@SpringBootApplication
public class MuestrasApplication {
    public static void main(String[] args) {
        SpringApplication.run(MuestrasApplication.class, args);
    }
}

@Entity
@Table(name = "muestra", schema = "muestras")
class Muestra {
    @Id @GeneratedValue(strategy = GenerationType.UUID) UUID id;
    @Column(name = "paciente_id") UUID pacienteId;
    @Column(name = "codigo_barras") String codigoBarras;
    String estado;
    @Column(name = "trace_id") String traceId;
    @Column(name = "created_at") OffsetDateTime createdAt;

    public UUID getId() { return id; }
    public UUID getPacienteId() { return pacienteId; }
    public void setPacienteId(UUID v) { this.pacienteId = v; }
    public String getCodigoBarras() { return codigoBarras; }
    public void setCodigoBarras(String v) { this.codigoBarras = v; }
    public String getEstado() { return estado; }
    public void setEstado(String v) { this.estado = v; }
    public String getTraceId() { return traceId; }
    public void setTraceId(String v) { this.traceId = v; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}

interface MuestraRepository extends JpaRepository<Muestra, UUID> {
    List<Muestra> findByEstado(String estado);
}

@Component
class IngestaConsumer {
    private final MuestraRepository repo;
    private final KafkaTemplate<String, String> kafka;
    private final ObjectMapper mapper = new ObjectMapper();

    IngestaConsumer(MuestraRepository repo, KafkaTemplate<String, String> kafka) {
        this.repo = repo;
        this.kafka = kafka;
    }

    @KafkaListener(topics = "normalized.results", groupId = "ms-muestras")
    public void onNormalized(@Payload String payload,
                             @Header(value = "trace_id", required = false) byte[] traceIdBytes) {
        String traceId = traceIdBytes != null ? new String(traceIdBytes) : UUID.randomUUID().toString();
        try {
            JsonNode root = mapper.readTree(payload);
            // Crear muestra "placeholder" si no existe; en un sistema real, esto vendría
            // de un registro previo del flebotomista. Para el MVP-mock se genera aquí.
            Muestra m = new Muestra();
            m.setPacienteId(UUID.fromString("11111111-1111-1111-1111-111111111111"));
            m.setCodigoBarras("MVP-" + UUID.randomUUID().toString().substring(0, 8));
            m.setEstado("RECIBIDA");
            m.setTraceId(traceId);
            Muestra saved = repo.save(m);

            // Reenviar a ms-analitico con el resultado normalizado
            JsonNode observaciones = root.path("observation");
            String analiticoPayload = mapper.createObjectNode()
                .put("muestra_id", saved.getId().toString())
                .put("trace_id", traceId)
                .set("observaciones", observaciones).toString();
            kafka.send("muestra.recibida", analiticoPayload);
        } catch (Exception e) {
            throw new RuntimeException("normalized.results processing failed: " + e.getMessage(), e);
        }
    }
}

@RestController
@RequestMapping("/muestras")
class MuestraController {
    private final MuestraRepository repo;

    MuestraController(MuestraRepository repo) { this.repo = repo; }

    @GetMapping
    public List<Muestra> list() { return repo.findAll(); }

    @GetMapping("/{id}")
    public Muestra get(@PathVariable UUID id) { return repo.findById(id).orElseThrow(); }
}
