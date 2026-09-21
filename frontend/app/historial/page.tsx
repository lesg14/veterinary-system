"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CircleAlert,
  Clock3,
  FileText,
  PawPrint,
  Search,
} from "lucide-react";
import Link from "next/link";
import styles from "./historial.module.css";

type Appointment = {
  id: number;
  starts_at: string;
  ends_at: string;
  status: "SCHEDULED" | "ATTENDED" | "CANCELED" | "NO_SHOW";
  pet_name: string;
  professional_name: string;
  consultation_type_name: string;
  consultation_duration_minutes: number;
  cancellation_requested_at: string | null;
};

type Professional = { id: number; full_name: string };
type Pet = { id: number; name: string };

const statusLabels: Record<Appointment["status"], string> = {
  SCHEDULED: "Programada",
  ATTENDED: "Atendida",
  CANCELED: "Cancelada",
  NO_SHOW: "Inasistencia",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function HistoryPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [professionalId, setProfessionalId] = useState("ALL");
  const [petId, setPetId] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetch("/api/professionals/"), fetch("/api/pets/")])
      .then(async ([professionalResponse, petResponse]) => {
        setProfessionals(await professionalResponse.json());
        setPets(await petResponse.json());
      })
      .catch(() => setError("No fue posible cargar los filtros."));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ status });
    if (search) query.set("search", search);
    if (professionalId !== "ALL") query.set("professional_id", professionalId);
    if (petId !== "ALL") query.set("pet_id", petId);
    if (dateFrom) query.set("date_from", dateFrom);
    if (dateTo) query.set("date_to", dateTo);
    setLoading(true);
    fetch(`/api/appointments/history/?${query.toString()}`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok)
          throw new Error("No fue posible cargar el histórico.");
        return response.json();
      })
      .then(setAppointments)
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [search, status, professionalId, petId, dateFrom, dateTo]);

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark}>
            <PawPrint size={19} />
          </span>
          <span>RockyVet</span>
        </Link>
        <div className={styles.sideIntro}>
          <span>OPERACIONES</span>
          <strong>Historial de citas</strong>
          <p>Consulta todas las citas registradas y sus estados.</p>
        </div>
        <nav className={styles.sideNav}>
          <Link href="/">
            <ArrowLeft size={17} /> Volver a agenda
          </Link>
          <Link href="/gestion">
            <PawPrint size={17} /> Pacientes
          </Link>
          <Link className={styles.selected} href="/historial">
            <CalendarDays size={17} /> Historial
          </Link>
        </nav>
        <div className={styles.sideNote}>
          Las citas canceladas y las inasistencias se conservan para consulta
          histórica.
        </div>
      </aside>
      <section className={styles.content}>
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>HISTÓRICO</span>
            <h1>Citas registradas</h1>
            <p>
              Consulta programaciones, atenciones, cancelaciones e
              inasistencias.
            </p>
          </div>
          <span className={styles.total}>{appointments.length} registros</span>
        </header>
        <section className={styles.filters}>
          <label className={styles.search}>
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar mascota, profesional o consulta..."
            />
          </label>
          <label>
            Estado
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="ALL">Todos los estados</option>
              <option value="SCHEDULED">Programadas</option>
              <option value="ATTENDED">Atendidas</option>
              <option value="CANCELED">Canceladas</option>
              <option value="NO_SHOW">Inasistencias</option>
            </select>
          </label>
          <label>
            Profesional
            <select
              value={professionalId}
              onChange={(event) => setProfessionalId(event.target.value)}
            >
              <option value="ALL">Todos</option>
              {professionals.map((professional) => (
                <option key={professional.id} value={professional.id}>
                  {professional.full_name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Mascota
            <select
              value={petId}
              onChange={(event) => setPetId(event.target.value)}
            >
              <option value="ALL">Todas</option>
              {pets.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {pet.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Desde
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </label>
          <label>
            Hasta
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </label>
        </section>
        {error && (
          <div className={styles.error}>
            <CircleAlert size={17} />
            {error}
          </div>
        )}
        {loading ? (
          <div className={styles.empty}>Cargando histórico...</div>
        ) : appointments.length === 0 ? (
          <div className={styles.empty}>
            <FileText size={26} />
            <strong>No hay citas con estos filtros</strong>
            <span>
              Las citas guardadas aparecerán aquí, incluso si fueron canceladas
              o quedaron como inasistencia.
            </span>
          </div>
        ) : (
          <section className={styles.list}>
            {appointments.map((appointment) => (
              <article
                className={`${styles.card} ${styles[appointment.status.toLowerCase()]}`}
                key={appointment.id}
              >
                <div className={styles.cardMain}>
                  <div className={styles.cardTime}>
                    <Clock3 size={15} />
                    <strong>{formatDateTime(appointment.starts_at)}</strong>
                    <span>
                      hasta{" "}
                      {new Intl.DateTimeFormat("es-CO", {
                        timeStyle: "short",
                      }).format(new Date(appointment.ends_at))}
                    </span>
                  </div>
                  <div>
                    <h2>{appointment.pet_name}</h2>
                    <p>
                      {appointment.consultation_type_name} ·{" "}
                      {appointment.consultation_duration_minutes} minutos
                    </p>
                    <span>{appointment.professional_name}</span>
                  </div>
                </div>
                <div className={styles.cardMeta}>
                  <span className={styles.badge}>
                    {statusLabels[appointment.status]}
                  </span>
                  {appointment.cancellation_requested_at && (
                    <small>
                      Gestionada el{" "}
                      {formatDateTime(appointment.cancellation_requested_at)}
                    </small>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}
