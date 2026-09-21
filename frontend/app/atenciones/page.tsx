"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CircleAlert,
  FileText,
  PawPrint,
  Plus,
  Stethoscope,
  X,
} from "lucide-react";
import Link from "next/link";
import styles from "./atenciones.module.css";

type Pet = { id: number; name: string; species_name: string; vital_status: string };
type Professional = { id: number; full_name: string; specialty: string };
type Visit = {
  id: number;
  pet: number;
  professional: number;
  appointment: number | null;
  attended_at: string;
  reason: string;
  diagnosis: string;
  treatment: string;
  recommendations: string;
  notes: string;
};

export default function AttentionsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const responses = await Promise.all([
        fetch("/api/visits/"),
        fetch("/api/pets/"),
        fetch("/api/professionals/"),
      ]);
      if (responses.some((response) => !response.ok))
        throw new Error("No fue posible cargar las atenciones.");
      setVisits(await responses[0].json());
      setPets(await responses[1].json());
      setProfessionals(await responses[2].json());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No fue posible cargar las atenciones.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);
  const petName = (id: number) =>
    pets.find((pet) => pet.id === id)?.name || `Mascota #${id}`;
  const professionalName = (id: number) =>
    professionals.find((professional) => professional.id === id)?.full_name ||
    `Profesional #${id}`;

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark}>
            <PawPrint size={19} />
          </span>
          <span>vetline</span>
        </Link>
        <div className={styles.sideIntro}>
          <span>HISTORIAL CLÍNICO</span>
          <strong>Atenciones</strong>
          <p>Registra y consulta la evolución médica de cada paciente.</p>
        </div>
        <nav className={styles.sideNav}>
          <Link href="/">
            <ArrowLeft size={17} /> Volver a agenda
          </Link>
          <Link href="/gestion">
            <PawPrint size={17} /> Pacientes
          </Link>
          <Link className={styles.selected} href="/atenciones">
            <FileText size={17} /> Atenciones
          </Link>
        </nav>
        <div className={styles.sideNote}>
          Registrar una atención cambia la cita asociada a “Atendida” y conserva
          el historial de la mascota.
        </div>
      </aside>
      <section className={styles.content}>
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>HISTORIAL CLÍNICO</span>
            <h1>Atenciones registradas</h1>
            <p>Diagnósticos y tratamientos asociados a las consultas.</p>
          </div>
          <button
            className={styles.primaryButton}
            onClick={() => setShowForm(true)}
          >
            <Plus size={17} /> Nueva atención
          </button>
        </header>
        {error && (
          <div className={styles.error}>
            <CircleAlert size={17} /> {error}
          </div>
        )}
        {loading ? (
          <div className={styles.loading}>Cargando historial...</div>
        ) : visits.length === 0 ? (
          <div className={styles.empty}>
            <FileText size={25} />
            <strong>No hay atenciones registradas</strong>
            <span>Registra la primera atención desde “Nueva atención”.</span>
          </div>
        ) : (
          <div className={styles.visitList}>
            {visits.map((visit) => (
              <article className={styles.visitCard} key={visit.id}>
                <div className={styles.visitTop}>
                  <div className={styles.petIcon}>
                    <PawPrint size={18} />
                  </div>
                  <div>
                    <h2>{petName(visit.pet)}</h2>
                    <span>
                      {professionalName(visit.professional)} ·{" "}
                      {new Intl.DateTimeFormat("es-CO", {
                        dateStyle: "medium",
                      }).format(new Date(visit.attended_at))}
                    </span>
                  </div>
                  <span className={styles.visitId}>Atención #{visit.id}</span>
                </div>
                <div className={styles.visitDetails}>
                  <div>
                    <small>Motivo</small>
                    <p>{visit.reason}</p>
                  </div>
                  <div>
                    <small>Diagnóstico</small>
                    <p>{visit.diagnosis || "Sin diagnóstico registrado"}</p>
                  </div>
                  <div>
                    <small>Tratamiento</small>
                    <p>{visit.treatment || "Sin tratamiento registrado"}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      {showForm && (
        <VisitModal
          pets={pets}
          professionals={professionals}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            loadData();
          }}
        />
      )}
    </main>
  );
}

function VisitModal({
  pets,
  professionals,
  onClose,
  onSaved,
}: {
  pets: Pet[];
  professionals: Professional[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    pet: "",
    professional: "",
    appointment: "",
    reason: "",
    diagnosis: "",
    treatment: "",
    recommendations: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const update = (key: string, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      pet: Number(form.pet),
      professional: Number(form.professional),
      appointment: form.appointment ? Number(form.appointment) : null,
    };
    const response = await fetch("/api/visits/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(
        Object.values(body || {})
          .flat()
          .join(" ") || "No se pudo guardar la atención.",
      );
      setSaving(false);
      return;
    }
    onSaved();
  }

  return (
    <div className={styles.backdrop} role="presentation">
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="visit-title"
      >
        <header>
          <div>
            <span className={styles.eyebrow}>HISTORIAL</span>
            <h2 id="visit-title">Nueva atención</h2>
          </div>
          <button onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>
        <form onSubmit={submit}>
          <div className={styles.grid}>
            <label>
              Mascota
              <select
                required
                value={form.pet}
                onChange={(event) => update("pet", event.target.value)}
              >
                <option value="">Seleccionar</option>
                {pets
                  .filter((pet) => pet.vital_status === "ALIVE")
                  .map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} · {pet.species_name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Profesional
              <select
                required
                value={form.professional}
                onChange={(event) => update("professional", event.target.value)}
              >
                <option value="">Seleccionar</option>
                {professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {professional.full_name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            ID de cita{" "}
            <input
              type="number"
              min="1"
              value={form.appointment}
              onChange={(event) => update("appointment", event.target.value)}
              placeholder="Opcional"
            />
          </label>
          <label>
            Motivo de consulta
            <textarea
              required
              value={form.reason}
              onChange={(event) => update("reason", event.target.value)}
            />
          </label>
          <label>
            Diagnóstico
            <textarea
              value={form.diagnosis}
              onChange={(event) => update("diagnosis", event.target.value)}
            />
          </label>
          <label>
            Tratamiento
            <textarea
              value={form.treatment}
              onChange={(event) => update("treatment", event.target.value)}
            />
          </label>
          <label>
            Recomendaciones
            <textarea
              value={form.recommendations}
              onChange={(event) =>
                update("recommendations", event.target.value)
              }
            />
          </label>
          {error && <p className={styles.formError}>{error}</p>}
          <footer>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button className={styles.primaryButton} disabled={saving}>
              {saving ? "Guardando..." : "Registrar atención"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
