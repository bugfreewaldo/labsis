package com.utp.labsis.pacientes;

import jakarta.persistence.*;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;

@SpringBootApplication
public class PacientesApplication {
    public static void main(String[] args) {
        SpringApplication.run(PacientesApplication.class, args);
    }
}

@Entity
@Table(name = "paciente", schema = "pacientes")
class Paciente {
    @Id @GeneratedValue(strategy = GenerationType.UUID) UUID id;
    @Column(name = "cedula_madre", nullable = false) String cedulaMadre;
    String nombre;
    String apellido;
    @Column(name = "fecha_nac") LocalDate fechaNac;
    @Column(name = "peso_kg") BigDecimal pesoKg;
    String sexo;
    String hospital;
    @Column(name = "created_at") OffsetDateTime createdAt;

    // getters / setters
    public UUID getId() { return id; }
    public String getCedulaMadre() { return cedulaMadre; }
    public void setCedulaMadre(String v) { this.cedulaMadre = v; }
    public String getNombre() { return nombre; }
    public void setNombre(String v) { this.nombre = v; }
    public String getApellido() { return apellido; }
    public void setApellido(String v) { this.apellido = v; }
    public LocalDate getFechaNac() { return fechaNac; }
    public void setFechaNac(LocalDate v) { this.fechaNac = v; }
    public BigDecimal getPesoKg() { return pesoKg; }
    public void setPesoKg(BigDecimal v) { this.pesoKg = v; }
    public String getSexo() { return sexo; }
    public void setSexo(String v) { this.sexo = v; }
    public String getHospital() { return hospital; }
    public void setHospital(String v) { this.hospital = v; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}

interface PacienteRepository extends JpaRepository<Paciente, UUID> {
    List<Paciente> findByCedulaMadre(String cedulaMadre);
}

@RestController
@RequestMapping("/pacientes")
class PacienteController {
    private final PacienteRepository repo;
    private final KafkaTemplate<String, String> kafka;

    PacienteController(PacienteRepository repo, KafkaTemplate<String, String> kafka) {
        this.repo = repo;
        this.kafka = kafka;
    }

    @GetMapping
    public List<Paciente> list(@RequestParam(required = false) String cedulaMadre) {
        return cedulaMadre != null ? repo.findByCedulaMadre(cedulaMadre) : repo.findAll();
    }

    @GetMapping("/{id}")
    public Paciente get(@PathVariable UUID id) {
        return repo.findById(id).orElseThrow();
    }

    @PostMapping
    public Paciente create(@RequestBody Paciente p) {
        Paciente saved = repo.save(p);
        kafka.send("paciente.creado",
            "{\"id\":\"" + saved.getId() + "\",\"cedula_madre\":\"" + saved.getCedulaMadre() + "\"}");
        return saved;
    }
}
