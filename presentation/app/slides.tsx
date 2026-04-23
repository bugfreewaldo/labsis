'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Slide, Bullets, Figure, TwoCol, Stat, Typewriter, AmbientBG } from '@/components/Slide';
import type { DeckSlide } from '@/components/Deck';

// ------------------------ 1. Portada (hero animada) ------------------------
function S1Portada() {
  return (
    <div className="slide relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1F4E79 0%, #0b1e32 70%, #173D5E 100%)' }}>
      <AmbientBG>
        <div className="h-full flex flex-col justify-center items-center text-center px-12 text-white relative z-10">
          <motion.div
            className="text-sm tracking-[0.3em] uppercase opacity-75"
            initial={{ opacity: 0, y: -20, letterSpacing: '0.1em' }}
            animate={{ opacity: 0.8, y: 0, letterSpacing: '0.3em' }}
            transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
          >
            Universidad Tecnológica de Panamá
          </motion.div>
          <motion.div
            className="text-base italic opacity-80 mt-1"
            initial={{ opacity: 0 }} animate={{ opacity: 0.85 }} transition={{ delay: 0.35, duration: 0.8 }}
          >
            Maestría en Ingeniería de Software · Tópicos Especiales Avanzados II
          </motion.div>

          <div className="flex-1 flex flex-col justify-center">
            <motion.h1
              className="text-5xl font-extrabold leading-tight max-w-5xl"
              initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.55, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
            >
              Modernización de la Infraestructura Nacional{' '}
              <motion.span
                className="bg-gradient-to-r from-panama-yellow via-emerald-300 to-panama-yellow bg-[length:200%_auto] bg-clip-text text-transparent"
                animate={{ backgroundPosition: ['0% 50%', '200% 50%'] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              >
                Labsis
              </motion.span>
            </motion.h1>
            <motion.p
              className="mt-5 text-lg italic max-w-3xl opacity-90"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 0.95, y: 0 }}
              transition={{ delay: 0.95, duration: 0.8 }}
            >
              Arquitectura cloud-native, resiliencia, observabilidad e interoperabilidad
              basada en IA para el Programa Nacional de Tamizaje Neonatal de Panamá
            </motion.p>
          </div>

          <motion.div
            className="space-y-1"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 1.2 } } }}
          >
            <motion.p className="text-lg font-bold"
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
              Pittí, Edgardo · Restrepo, Osvaldo · Salazar, Carlos
            </motion.p>
            <motion.p className="text-sm opacity-80"
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 0.85, y: 0 } }}>
              Grupo 1MW211 · Facilitador: Prof. Huriviades Calderón Gómez
            </motion.p>
            <motion.p className="text-xs opacity-60 mt-3"
              variants={{ hidden: { opacity: 0 }, show: { opacity: 0.6 } }}>
              Panamá · V Semestre · 2026
            </motion.p>
          </motion.div>
        </div>
      </AmbientBG>
    </div>
  );
}

// ------------------------ 2. Agenda ------------------------
function S2Agenda() {
  return (
    <Slide title="Agenda de los próximos 25 minutos">
      <Bullets size="lg" items={[
        { label: '1. Contexto y problema (4 min)',            body: 'Labsis hoy, SPOF total, InterfazLabsis CMD, backup.bat' },
        { label: '2. Justificación y decisiones (4 min)',     body: 'Por qué descomponer, monolito vs MSA con evidencia empírica' },
        { label: '3. Arquitectura propuesta (5 min)',         body: 'Microservicios, event-driven, cloud-native, conectividad segura' },
        { label: '4. Resiliencia y observabilidad (4 min)',   body: 'Patrones Resilience4j, OPA externalizado, LGTM stack' },
        { label: '5. Demostración MVP en vivo (6 min)',       body: '8 placas de 96 pozos, autovalidación, failover, CB abierto' },
        { label: '6. Conclusiones y preguntas (2 min)',       body: 'Qué llevamos, qué sigue para producción' }
      ]} />
    </Slide>
  );
}

// ------------------------ 3. Contexto ------------------------
function S3Contexto() {
  return (
    <Slide title="1. Contexto" subtitle="Labsis: Sistema nacional de Tamizaje Neonatal, HJRE, MINSA">
      <TwoCol ratio="3:2"
        left={
          <Bullets items={[
            'Monolito Seam/Java EE de Laboratory Technologies Inc.',
            'Dominios: tamizajehdn.com (portal ciudadano) y /labsis (admin)',
            'Panel de 6 analitos: IRT, TSH, G6PD, NeoPhe, 17-OHP, TGAL',
            'Volumen analítico: 8 placas × 96 pozos ≈ 768 resultados por corrida',
            { label: 'Autovalidación', body: 'rangos por analito; 17-OHP depende del peso del neonato (< 2.5 kg vs ≥ 2.5 kg)' },
            { label: 'Ventana clínica', body: 'días, no horas, para intervenir un positivo' }
          ]} />
        }
        right={
          <div className="bg-navy/5 border border-navy/30 rounded-xl p-5 h-full">
            <div className="text-sm font-bold text-navy">HJRE · Portal ciudadano real</div>
            <div className="text-xs italic text-slate-500 mt-1">tamizajehdn.com/labsis-patients</div>
            <div className="mt-4 text-sm text-slate-700 leading-relaxed">
              <p className="mb-2">Login = cédula de la madre + fecha de nacimiento del bebé.</p>
              <p className="font-semibold">Ejemplo real observado:</p>
              <ul className="list-none space-y-1 mt-2">
                <li>· Paciente: Sarah Pittí</li>
                <li>· Cédula madre: 4-769-466</li>
                <li>· Peso: 3.37 kg</li>
                <li>· 17-OHP: 8.8 ng/mL (rango ≥ 2.5 kg: ≤ 10.6)</li>
                <li>· Estado: Autovalidado Exitosamente</li>
              </ul>
            </div>
          </div>
        }
      />
    </Slide>
  );
}

// ------------------------ 4. Problema ------------------------
function S4Problema() {
  return (
    <Slide title="1. El problema estructural"
           subtitle='Si el sistema cae, no hay sistema para nadie (ni lab ni padres)'>
      <Bullets size="sm" items={[
        { label: 'Punto único de fallo total', body: 'laboratorio y portal ciudadano comparten instancia, servidor y BD' },
        { label: 'Conectividad insegura', body: 'una ventana CMD dedicada por equipo; InterfazLabsis lee G6PD.A34 de directorio compartido, TCP plano sin TLS' },
        { label: 'Desarrollo 1 a 1 por cada equipo nuevo', body: 'semanas o meses para integrar hardware ya disponible' },
        { label: 'Volumen batch subutilizado', body: 'placa 96 × 8 procesada una a una, saturando el servidor' },
        { label: 'Backup artesanal', body: 'script backup.bat manual en PC de técnico, 3 pm, RPO 24 h' },
        { label: 'Autovalidación cableada al monolito', body: 'cambiar un rango regulatorio exige redeploy completo' },
        { label: 'Observabilidad pobre', body: 'logs planos, sin métricas ni trazas, diagnóstico reactivo' }
      ]} />
    </Slide>
  );
}

// ------------------------ 5. Monolito vs MSA ------------------------
function S5MonolitoVsMSA() {
  const rows: [string, string, string][] = [
    ['Autonomía de despliegue',    'Baja: un cambio redespliega todo', 'Alta: por servicio'],
    ['Escalabilidad selectiva',    'No',                                'Sí (portal vs lab)'],
    ['Aislamiento de fallos',      'Un bug cae todo',                   'Bulkheads + CB'],
    ['Time-to-market',             'Meses / trimestre',                 'Días / semana'],
    ['Ajuste al dominio clínico',  'Bajo',                              'Alto (SLA diferenciado)']
  ];
  return (
    <Slide title="2. Monolito vs. Microservicios"
           subtitle="Evidencia empírica + dominio clínico justifican la descomposición">
      <div className="rounded-lg overflow-hidden border border-slate-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-navy to-navy-700 text-white">
              <th className="text-left px-4 py-3 font-semibold">Criterio</th>
              <th className="text-left px-4 py-3 font-semibold">Monolito</th>
              <th className="text-left px-4 py-3 font-semibold">Microservicios</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <motion.tr
                key={i}
                className={i % 2 ? 'bg-slate-50' : 'bg-white'}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.12, type: 'spring', damping: 22, stiffness: 180 }}
              >
                <td className="px-4 py-3 font-semibold">{r[0]}</td>
                <td className="px-4 py-3 text-red-700/80">{r[1]}</td>
                <motion.td
                  className="px-4 py-3 font-medium text-panama-green"
                  initial={{ backgroundColor: 'rgba(22,163,74,0)' }}
                  animate={{ backgroundColor: ['rgba(22,163,74,0)', 'rgba(22,163,74,0.15)', 'rgba(22,163,74,0)'] }}
                  transition={{ delay: 0.5 + i * 0.12, duration: 1.4 }}
                >
                  {r[2]}
                </motion.td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      <motion.p
        className="mt-4 text-xs italic text-slate-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 + rows.length * 0.12 + 0.5 }}
      >
        Respaldo empírico: Calderón-Gómez et al., <i>Applied Sciences</i> 11:4350 (2021)
        sobre SOA vs MSA en eHealth; Blinowski et al., <i>IEEE Access</i> 10 (2022);
        Tapia et al., <i>Applied Sciences</i> 10:5797 (2020).
      </motion.p>
    </Slide>
  );
}

// ------------------------ 6. Objetivo ------------------------
function S6Objetivo() {
  return (
    <Slide title="2. Objetivo y alcance del MVP-mock">
      <p className="text-lg text-slate-700 leading-relaxed">
        Diseñar e implementar parcialmente un sistema cloud-native basado en
        microservicios para Labsis, que elimine puntos únicos de fallo, automatice
        la ingesta de equipos con IA y provea resiliencia y observabilidad por
        diseño, gestionado con metodología Kanban.
      </p>
      <motion.div className="grid grid-cols-4 gap-4 mt-8"
        initial="hidden" animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.16, delayChildren: 0.4 } } }}>
        <Stat value="50%"  label="Cobertura del MVP"         color="navy"   delay={0.5} />
        <Stat value="20"   label="Contenedores ejecutándose" color="green"  delay={0.7} />
        <Stat value="768"  label="Resultados / corrida (8×96)" color="yellow" delay={0.9} />
        <Stat value="≤ 5 s" label="RPO (vs. 24 h actual)"    color="red"    delay={1.1} />
      </motion.div>
      <div className="mt-6">
        <Bullets size="sm" items={[
          { label: 'No es un reemplazo de producción', body: 'el Labsis real seguirá operando; esto evidencia la tesis de descomposición' },
          { label: '3 dolores priorizados', body: 'CMD → ia-mapper · backup.bat → pgBackRest · portal acoplado → Next.js desacoplado' }
        ]} />
      </div>
    </Slide>
  );
}

// ------------------------ 7. Casos de uso ------------------------
function S7CasosDeUso() {
  return (
    <Slide title="3. Vista funcional" subtitle="Módulos y actores del Labsis modernizado">
      <Figure src="/diagrams/casos_de_uso.png" alt="Diagrama de casos de uso"
              caption="Figura 1 del informe. Actores internos (secretaria, flebotomista, tecnólogo, director/MINSA), externos (paciente/tutor, entidad de salud) y sistemas (equipos de laboratorio, API de IA)."
              maxW="65%" />
    </Slide>
  );
}

// ------------------------ 8. Arquitectura ------------------------
function S8Arquitectura() {
  return (
    <Slide title="3. Arquitectura cloud-native de referencia">
      <Figure src="/diagrams/arquitectura_labsis.png"
              alt="Arquitectura cloud-native"
              caption="Planos de borde, aplicación, ingesta event-driven, datos y observabilidad/seguridad."
              maxW="95%" />
    </Slide>
  );
}

// ------------------------ 9. Conectividad ------------------------
function S9Conectividad() {
  return (
    <Slide title="3. Reemplazo de la InterfazLabsis CMD"
           subtitle="equipo-connect (mTLS) + ia-mapper (Claude + reglas deterministas)">
      <Figure src="/diagrams/conectividad_antes_despues.png"
              alt="Antes vs. Después conectividad"
              caption="Izquierda: CMD + archivo plano sobre TCP sin cifrar. Derecha: agente zero-trust + Kafka + ia-mapper."
              maxW="70%" />
    </Slide>
  );
}

// ------------------------ 10. Despliegue ------------------------
function S10Despliegue() {
  return (
    <Slide title="3. Despliegue" subtitle="Nube híbrida, Kubernetes, separación por namespaces">
      <Figure src="/diagrams/despliegue_k8s.png" alt="Despliegue Kubernetes" maxW="95%" />
    </Slide>
  );
}

// ------------------------ 11. Resiliencia ------------------------
function S11Resiliencia() {
  return (
    <Slide title="4. Resiliencia" subtitle="Bulkhead → Retry → Timeout → Circuit Breaker → Fallback">
      <TwoCol ratio="2:1"
        left={<Figure src="/diagrams/resiliencia_patrones.png" alt="Patrones de resiliencia" maxW="98%" />}
        right={
          <Bullets size="sm" items={[
            'Resilience4j en Spring Boot 3',
            'Métricas expuestas a Prometheus',
            { label: 'Fallback conservador', body: 'REVISAR (nunca auto-aprobar)' },
            'Backup continuo con pgBackRest',
            'Prueba de restauración automatizada',
            { label: 'Base teórica', body: 'Avižienis et al., IEEE TDSC (2004)' }
          ]} />
        }
      />
    </Slide>
  );
}

// ------------------------ 12. Observabilidad ------------------------
function S12Observabilidad() {
  return (
    <Slide title="4. Observabilidad por diseño" subtitle="Tres pilares · OpenTelemetry · Grafana LGTM">
      <TwoCol ratio="2:1"
        left={<Figure src="/diagrams/observabilidad_pilares.png" alt="Observabilidad" maxW="98%" />}
        right={
          <Bullets size="sm" items={[
            'SDK único OpenTelemetry',
            'Métricas RED + USE',
            'Logs JSON con trace_id',
            'Trazas distribuidas (Tempo)',
            { label: '3 dashboards', body: 'Overview, Ingesta, Resiliencia' },
            { label: 'SLO', body: 'p95 < 400 ms · disp. ≥ 99.5 %' },
            { label: 'MTTR objetivo', body: '< 10 min' },
            { label: 'Base', body: 'Borges ICSA 2024 · Albuquerque & Correia 2025' }
          ]} />
        }
      />
    </Slide>
  );
}

// ------------------------ 13. Ingesta inteligente ------------------------
function S13IngestaSeq() {
  return (
    <Slide title="4. Flujo de ingesta inteligente"
           subtitle="Equipo → equipo-connect → ia-mapper → Kafka → ms-muestras → ms-analitico → OPA">
      <Figure src="/diagrams/ingesta_inteligente_seq.png"
              alt="Secuencia ingesta inteligente"
              maxW="65%" />
    </Slide>
  );
}

// ------------------------ 14. Demo ------------------------
function S14Demo() {
  const actos = [
    { act: '0:45', title: 'Hola mundo',       body: 'Una trama G6PD.A34 fluye end-to-end' },
    { act: '1:45', title: 'Batch 8×96',       body: '768 resultados procesados en paralelo' },
    { act: '3:00', title: '17-OHP peso-dep',  body: 'Regla cambia sin redeploy (OPA)' },
    { act: '4:00', title: 'Chaos latencia',   body: 'CB abre · fallback conservador' },
    { act: '5:00', title: 'Chaos kill primary', body: 'Portal sigue respondiendo' }
  ];
  return (
    <Slide title="5. Demostración en vivo (MVP-mock)" subtitle="make demo · 5 actos · 5 minutos">
      <motion.div className="grid grid-cols-5 gap-4 mt-2"
        initial="hidden" animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } } }}>
        {actos.map((a, i) => (
          <motion.div
            key={i}
            className="bg-gradient-to-br from-navy/5 to-navy/10 border border-navy/20 rounded-lg p-4 relative overflow-hidden"
            variants={{
              hidden: { opacity: 0, y: 20, scale: 0.95 },
              show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 18, stiffness: 200 } }
            }}
            whileHover={{ y: -6, boxShadow: '0 10px 30px -10px rgba(31,78,121,0.4)' }}
          >
            <motion.div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + 0.15 * i }}
              style={{ background: 'radial-gradient(circle at top left, rgba(22,163,74,.12), transparent 70%)' }}
            />
            <div className="text-xs font-mono text-panama-green font-bold">{a.act}</div>
            <div className="font-bold text-navy mt-1">{a.title}</div>
            <div className="text-xs text-slate-600 mt-2">{a.body}</div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="mt-8 bg-[#0b1e32] text-green-300 font-mono text-sm p-4 rounded-lg border border-green-500/20 shadow-2xl relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.6 }}
      >
        <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
          <span className="w-3 h-3 rounded-full bg-red-500/80" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <span className="w-3 h-3 rounded-full bg-green-500/80" />
          <span className="text-slate-400 text-xs ml-2">bash · labsis-mvp</span>
        </div>
        <div className="text-slate-400">
          <Typewriter text="# en una terminal abierta sobre labsis-mvp/" speed={18} delay={1200} caret={false} />
        </div>
        <div className="text-green-300">
          <span className="text-slate-500">$ </span>
          <Typewriter text="make demo" speed={70} delay={2600} />
        </div>
        <div className="text-slate-500 text-xs mt-3 italic">
          Al costado abrir Grafana (localhost:3000) y el portal ciudadano (localhost:3001)
        </div>
      </motion.div>
    </Slide>
  );
}

// ------------------------ 15. Resultados + Limitaciones ------------------------
function S15Resultados() {
  return (
    <Slide title="Resultados del MVP y limitaciones">
      <TwoCol
        left={
          <div>
            <h2 className="text-panama-green font-bold mb-3">Lo que el MVP muestra</h2>
            <Bullets size="sm" items={[
              'Ingesta end-to-end con Claude Haiku + parsers deterministas',
              'Failover de PostgreSQL verificado (promoción manual del standby)',
              'OPA con regla 17-OHP peso-dependiente',
              'Circuit Breaker visible en Grafana',
              'Portal Next.js leyendo del standby',
              'Backup y restauración automatizada',
              '3 dashboards LGTM con métricas, logs y trazas'
            ]} />
          </div>
        }
        right={
          <div>
            <h2 className="text-red-700 font-bold mb-3">Limitaciones reconocidas</h2>
            <Bullets size="sm" items={[
              'Firma PKI estatal simulada (autofirmado)',
              'LLM acotado: formatos representativos',
              'Pruebas de carga sobre datos sintéticos',
              'Seguridad endurecida sólo conceptual',
              'Despliegue K8s demostrativo (k3d/kind)',
              'Módulos de BI predictivo y SMS fuera del MVP'
            ]} />
          </div>
        }
      />
    </Slide>
  );
}

// ------------------------ 16. Conclusiones ------------------------
function S16Conclusiones() {
  return (
    <Slide title="6. Conclusiones">
      <Bullets size="lg" items={[
        'La modernización no es reemplazar una pila por otra: es cambiar la forma del sistema.',
        { label: 'Descomposición alineada al negocio', body: 'ritmos clínicos diferenciados por microservicio' },
        { label: 'IA en la interoperabilidad, no en la decisión clínica', body: 'la autovalidación la firma OPA más el tecnólogo' },
        { label: 'Resiliencia y observabilidad como propiedades, no disciplinas', body: 'un sistema bien diseñado falla bien' },
        { label: 'Cultura de entrega continua', body: 'Kanban, ADRs, GitOps y runbooks son tan críticos como K8s o Kafka' }
      ]} />
    </Slide>
  );
}

// ------------------------ 17. Referencias clave ------------------------
function S17Referencias() {
  return (
    <Slide title="Referencias IEEE destacadas" subtitle="41 en el informe · 10 aquí">
      <ol className="text-sm space-y-2 text-slate-700 leading-snug">
        <li><span className="font-mono text-navy">[23]</span> H. Calderón-Gómez, <i>La evolución de los microservicios hacia la Industria 5.0</i>, PPT Unidad I, UTP, 2024.</li>
        <li><span className="font-mono text-navy">[25]</span> H. Calderón-Gómez, Tesis Doctoral: arquitectura en capas para eHealth, Univ. Alcalá, 2023.</li>
        <li><span className="font-mono text-navy">[27]</span> H. Calderón-Gómez et al., <i>Applied Sciences</i> 11:4350 (2021) — SOA vs MSA en eHealth.</li>
        <li><span className="font-mono text-navy">[28]</span> G. Blinowski et al., <i>IEEE Access</i> 10:20357–20374 (2022) — Monolith vs Microservice.</li>
        <li><span className="font-mono text-navy">[31]</span> S. Deng et al., <i>Proc. IEEE</i> 112(1) (2024) — Cloud-native Services Survey.</li>
        <li><span className="font-mono text-navy">[32]</span> H. Calderón-Gómez, Apuntes Docker Unidad IV, UTP, 2024.</li>
        <li><span className="font-mono text-navy">[36]</span> A. Avižienis et al., <i>IEEE TDSC</i> 1(1) (2004) — Dependable &amp; Secure Computing.</li>
        <li><span className="font-mono text-navy">[37]</span> M. Mohammad, SLR Resilient Microservices, arXiv:2512.16959 (2025).</li>
        <li><span className="font-mono text-navy">[40]</span> M. Borges et al., <i>IEEE ICSA</i> (2024) — Observability Design Decisions.</li>
        <li><span className="font-mono text-navy">[41]</span> Albuquerque &amp; Correia, arXiv:2510.02991 (2025) — Tracing &amp; Metrics Design Patterns.</li>
      </ol>
    </Slide>
  );
}

// ------------------------ 18. Preguntas ------------------------
function S18QA() {
  return (
    <div className="slide relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1F4E79 0%, #0b1e32 60%, #173D5E 100%)' }}>
      <AmbientBG>
        <div className="h-full flex flex-col justify-center items-center text-center text-white px-12 relative z-10">
          <motion.h1
            className="text-8xl font-extrabold"
            initial={{ opacity: 0, scale: 0.8, filter: 'blur(12px)' }}
            animate={{
              opacity: 1,
              scale: [0.8, 1.02, 1],
              filter: 'blur(0px)'
            }}
            transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <motion.span
              className="bg-gradient-to-r from-white via-panama-yellow to-white bg-[length:200%_auto] bg-clip-text text-transparent"
              animate={{ backgroundPosition: ['0% 50%', '200% 50%'] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
            >
              ¿Preguntas?
            </motion.span>
          </motion.h1>
          <motion.p
            className="mt-10 text-lg opacity-90"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 0.9, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            Pittí · Restrepo · Salazar — Grupo 1MW211 — Mayo 2026
          </motion.p>
          <motion.p
            className="mt-3 text-xs italic opacity-70"
            initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: 1.2 }}
          >
            Informe: Restrepo_Pitti_Salazar_Grupo1_ProyectoFinal.docx · Repo: labsis-mvp/
          </motion.p>

          {/* floating dots for subtle motion */}
          <motion.div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} transition={{ delay: 0.6, duration: 1.5 }}
          >
            {Array.from({ length: 18 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-white/60"
                style={{ top: `${(i * 53) % 100}%`, left: `${(i * 37 + 11) % 100}%` }}
                animate={{ y: [0, -12, 0], opacity: [0.2, 0.8, 0.2] }}
                transition={{ duration: 3.5 + (i % 5), repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </motion.div>
        </div>
      </AmbientBG>
    </div>
  );
}

// ================== EXPORTED DECK ==================
export const slides: DeckSlide[] = [
  { id: 'portada',       title: 'Portada',                           render: () => <S1Portada />,       notes: 'Bienvenida, 30 s. Menciona el nombre completo del proyecto y la naturaleza de MVP-mock.' },
  { id: 'agenda',        title: 'Agenda',                            render: () => <S2Agenda />,        notes: 'Marca los tiempos de cada bloque; recuerda al jurado que 6 min son demo en vivo.' },
  { id: 'contexto',      title: 'Contexto',                          render: () => <S3Contexto />,      notes: 'Labsis es real (Laboratory Technologies Inc., HJRE). Menciona el portal tamizajehdn.com. Panel 6 analitos, 17-OHP peso-dep.' },
  { id: 'problema',      title: 'Problema estructural',              render: () => <S4Problema />,      notes: 'Énfasis en "si el sistema cae, no hay sistema para nadie". Backup.bat a las 3 pm en PC de técnico es un argumento contundente.' },
  { id: 'monolito-vs',   title: 'Monolito vs. Microservicios',       render: () => <S5MonolitoVsMSA />, notes: 'Cita el paper del profesor (Calderón-Gómez 2021) explícitamente. Es el ancla.' },
  { id: 'objetivo',      title: 'Objetivo y alcance',                render: () => <S6Objetivo />,      notes: 'Aclara que el alcance es 50% por lineamiento, bosquejo ejecutable. RPO baja de 24h a 5s.' },
  { id: 'casos-uso',     title: 'Casos de uso',                      render: () => <S7CasosDeUso />,    notes: 'Describe brevemente los cinco módulos y los actores internos vs externos.' },
  { id: 'arquitectura',  title: 'Arquitectura cloud-native',         render: () => <S8Arquitectura />,  notes: 'Narra los 5 planos: borde, aplicación, ingesta, datos, observabilidad/seguridad. Menciona CQRS ligera.' },
  { id: 'conectividad',  title: 'Conectividad antes / después',      render: () => <S9Conectividad />,  notes: 'Subraya que CMD deja de existir. Identidad por equipo con cert-manager. Time-to-market de semanas a horas.' },
  { id: 'despliegue',    title: 'Despliegue Kubernetes',             render: () => <S10Despliegue />,   notes: 'Namespaces separados por responsabilidad. HPA sobre los Deployments sin estado. Helm umbrella chart.' },
  { id: 'resiliencia',   title: 'Patrones de resiliencia',           render: () => <S11Resiliencia />,  notes: 'Bulkhead-Retry-Timeout-CB-Fallback no son aditivos sin coste: jitter para evitar retry storms. Fallback conservador: REVISAR.' },
  { id: 'observabilidad',title: 'Observabilidad por diseño',         render: () => <S12Observabilidad />, notes: 'Navegar entre métricas-logs-trazas por trace_id. SLOs y error budget como gate de release.' },
  { id: 'ingesta-seq',   title: 'Secuencia ingesta inteligente',     render: () => <S13IngestaSeq />,   notes: 'El LLM nunca decide clínicamente. Sólo interpreta formato. La decisión la firma OPA + tecnólogo.' },
  { id: 'demo',          title: 'Demo MVP en vivo',                  render: () => <S14Demo />,         notes: 'Abre terminal con "make demo" en segunda pantalla. Abre Grafana y el portal al lado. Narra mientras avanza.' },
  { id: 'resultados',    title: 'Resultados y limitaciones',         render: () => <S15Resultados />,   notes: 'Sé honesto con las limitaciones. La firma PAdES es simulada; el despliegue productivo requiere programa separado.' },
  { id: 'conclusiones',  title: 'Conclusiones',                      render: () => <S16Conclusiones />, notes: 'La frase "un sistema bien diseñado falla bien" es el cierre emocional. Cultura DevOps tan crítica como la tecnología.' },
  { id: 'referencias',   title: 'Referencias IEEE destacadas',       render: () => <S17Referencias />,  notes: 'Menciona que son 41 en el informe, pero estas 10 son las más citadas durante la defensa.' },
  { id: 'preguntas',     title: '¿Preguntas?',                       render: () => <S18QA />,           notes: 'Bloque de 2 min. Si preguntan por costos: el Labsis actual tiene costo oculto en ventanas de indisponibilidad; el MVP muestra cómo reducirlo.' }
];
