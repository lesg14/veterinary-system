"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileText,
  LayoutDashboard,
  PawPrint,
  Plus,
  Search,
  Settings2,
  Stethoscope,
  X,
} from "lucide-react";
import styles from "./page.module.css";

type Appointment = {
  id: number;
  starts_at: string;
  ends_at: string;
  status: "SCHEDULED" | "ATTENDED" | "CANCELED" | "NO_SHOW";
  pet: number;
  professional: number;
  consultation_type: number;
  notes?: string;
};

type Schedule = {
  professional_id: number;
  professional: string;
  appointments: Appointment[];
  free_slots: { starts_at: string; ends_at: string }[];
};

type AgendaResponse = {
  date: string;
  opening: string;
  closing: string;
  schedules: Schedule[];
};

type PetHistory = {
  id: number;
  name: string;
  species: string;
  breed: string;
  vital_status: string;
  appointments: Appointment[];
  visits: { id: number; attended_at: string; reason: string; diagnosis: string; treatment: string }[];
};

type PetOption = { id: number; name: string; species: string; breed: string; vital_status: string; is_active: boolean };
type ProfessionalOption = { id: number; full_name: string; specialty: string };
type ConsultationOption = { id: number; name: string; duration_minutes: number };

const statusLabels: Record<Appointment["status"], string> = {
  SCHEDULED: "Confirmada",
  ATTENDED: "Atendida",
  CANCELED: "Cancelada",
  NO_SHOW: "Inasistencia",
};

const colors = ["coral", "mint", "lilac"];

function formatTime(value: string) {
  return new Intl.DateTimeFormat("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${value}T12:00:00`));
}

function toDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(toDateInput(new Date()));
  const [professionalFilter, setProfessionalFilter] = useState("all");
  const [agenda, setAgenda] = useState<AgendaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  async function loadAgenda() {
    setLoading(true);
    setError("");
    const query = new URLSearchParams({ date: selectedDate });
    if (professionalFilter !== "all") query.set("professional_id", professionalFilter);
    try {
      const response = await fetch(`/api/agenda/?${query.toString()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("No fue posible cargar la agenda.");
      setAgenda(await response.json());
    } catch (requestError) {
      setAgenda(null);
      setError(requestError instanceof Error ? requestError.message : "No fue posible cargar la agenda.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAgenda();
  }, [selectedDate, professionalFilter]);

  const allAppointments = useMemo(() => agenda?.schedules.flatMap((schedule) => schedule.appointments) ?? [], [agenda]);
  const scheduledCount = allAppointments.filter((appointment) => appointment.status === "SCHEDULED").length;
  const attendedCount = allAppointments.filter((appointment) => appointment.status === "ATTENDED").length;
  const freeSlotsCount = agenda?.schedules.reduce((total, schedule) => total + schedule.free_slots.length, 0) ?? 0;

  function moveDate(days: number) {
    const nextDate = new Date(`${selectedDate}T12:00:00`);
    nextDate.setDate(nextDate.getDate() + days);
    setSelectedDate(toDateInput(nextDate));
  }

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}><span className={styles.brandMark}><PawPrint size={19} /></span><span>vetline</span></div>
        <div className={styles.clinicSwitch}><span className={styles.clinicDot} /> Clínica Central <ChevronRight size={15} /></div>
        <nav className={styles.nav} aria-label="Navegación principal">
          <a className={`${styles.navItem} ${styles.active}`} href="#agenda"><LayoutDashboard size={18} /> Agenda <span className={styles.navCount}>{scheduledCount}</span></a>
          <a className={styles.navItem} href="/gestion"><PawPrint size={18} /> Pacientes</a>
          <a className={styles.navItem} href="/atenciones"><FileText size={18} /> Atenciones</a>
        </nav>
        <div className={styles.navBottom}><a className={styles.navItem} href="#configuracion"><Settings2 size={18} /> Configuración</a></div>
        <div className={styles.userCard}><div className={styles.avatar}>LG</div><div><strong>Luis Eduardo Soto García</strong><span>Administradora</span></div><ChevronRight size={16} /></div>
      </aside>

      <section className={styles.content} id="agenda">
        <header className={styles.topbar}><div className={styles.crumb}><span>Operaciones</span><span>/</span><strong>Agenda diaria</strong></div><div className={styles.topActions}><button className={styles.iconButton} aria-label="Buscar"><Search size={18} /></button><button className={styles.helpButton}>?</button></div></header>
        <div className={styles.pageHeader}><div><p className={styles.eyebrow}>SÁBADO, 19 DE SEPTIEMBRE DE 2026</p><h1>Agenda diaria</h1><p className={styles.subtitle}>Una vista clara de lo que ocurre hoy en la clínica.</p></div><button className={styles.primaryButton} onClick={() => setShowNewAppointment(true)}><Plus size={18} /> Nueva cita</button></div>

        <div className={styles.toolbar}><div className={styles.dateControls}><button className={styles.iconButton} onClick={() => moveDate(-1)} aria-label="Día anterior"><ChevronLeft size={18} /></button><label className={styles.dateField}><CalendarDays size={17} /><input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label><button className={styles.iconButton} onClick={() => moveDate(1)} aria-label="Día siguiente"><ChevronRight size={18} /></button></div><label className={styles.filter}><Stethoscope size={16} /><select value={professionalFilter} onChange={(event) => setProfessionalFilter(event.target.value)}><option value="all">Todos los profesionales</option>{agenda?.schedules.map((schedule) => <option key={schedule.professional_id} value={schedule.professional_id}>{schedule.professional}</option>)}</select></label><button className={styles.todayButton} onClick={() => setSelectedDate(toDateInput(new Date()))}>Hoy</button></div>

        <div className={styles.dateTitle}><div><h2>{formatDate(selectedDate)}</h2><span>Horario de atención · 08:00 — 18:00</span></div><div className={styles.liveStatus}><span /> Agenda actualizada</div></div>
        <section className={styles.stats}><div className={styles.statCard}><div className={`${styles.statIcon} ${styles.coral}`}><CalendarDays size={18} /></div><div><span>Citas confirmadas</span><strong>{scheduledCount}</strong></div><small>para este día</small></div><div className={styles.statCard}><div className={`${styles.statIcon} ${styles.mint}`}><Clock3 size={18} /></div><div><span>Espacios libres</span><strong>{freeSlotsCount}</strong></div><small>bloques disponibles</small></div><div className={styles.statCard}><div className={`${styles.statIcon} ${styles.lilac}`}><FileText size={18} /></div><div><span>Atenciones realizadas</span><strong>{attendedCount}</strong></div><small>completadas hoy</small></div></section>

        {loading ? <div className={styles.emptyState}><div className={styles.loader} /><p>Cargando agenda...</p></div> : error ? <div className={styles.errorState}><CircleAlert size={22} /><div><strong>No se pudo conectar con la agenda</strong><p>{error} Verifica que Django esté ejecutándose en el puerto 8000.</p></div><button onClick={loadAgenda}>Reintentar</button></div> : <CalendarBoard agenda={agenda} onAppointmentClick={setSelectedAppointment} />}
      </section>
      {showNewAppointment && <AppointmentModal onClose={() => setShowNewAppointment(false)} onCreated={() => { setShowNewAppointment(false); loadAgenda(); }} />}
      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} />}
      {selectedAppointment && <AppointmentDetailModal appointment={selectedAppointment} onClose={() => setSelectedAppointment(null)} onSaved={() => { setSelectedAppointment(null); loadAgenda(); }} />}
    </main>
  );
}

function HistoryModal({ onClose }: { onClose: () => void }) {
  const [petId, setPetId] = useState("");
  const [history, setHistory] = useState<PetHistory | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function searchHistory(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setHistory(null);
    try {
      const response = await fetch(`/api/pets/${petId}/history/`);
      if (!response.ok) throw new Error("No se encontró una mascota con ese ID.");
      setHistory(await response.json());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No fue posible consultar el historial.");
    } finally {
      setLoading(false);
    }
  }

  return <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className={`${styles.modal} ${styles.historyModal}`} role="dialog" aria-modal="true" aria-labelledby="history-title"><div className={styles.modalHeader}><div><span className={styles.eyebrow}>PACIENTES</span><h2 id="history-title">Historial clínico</h2></div><button className={styles.iconButton} onClick={onClose} aria-label="Cerrar"><X size={18} /></button></div><form onSubmit={searchHistory} className={styles.historySearch}><label>ID de mascota<input required type="number" min="1" value={petId} onChange={(event) => setPetId(event.target.value)} placeholder="Ej. 1" /></label><button className={styles.primaryButton} disabled={loading}>{loading ? "Consultando..." : "Consultar historial"}</button></form>{error && <div className={styles.formError}><CircleAlert size={16} />{error}</div>}{history && <div className={styles.historyResult}><div className={styles.petSummary}><div className={`${styles.professionalAvatar} ${styles.mint}`}><PawPrint size={17} /></div><div><strong>{history.name}</strong><span>{history.species}{history.breed ? ` · ${history.breed}` : ""} · {history.vital_status === "DECEASED" ? "Fallecida" : "Viva"}</span></div></div><h3>Atenciones registradas ({history.visits.length})</h3>{history.visits.length === 0 ? <p className={styles.mutedText}>Aún no hay atenciones registradas.</p> : history.visits.map((visit) => <div className={styles.visitItem} key={visit.id}><strong>{new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(new Date(visit.attended_at))}</strong><span>{visit.reason}</span>{visit.diagnosis && <small>{visit.diagnosis}</small>}</div>)}</div>}</section></div>;
}

function ProfessionalSchedule({ schedule, color }: { schedule: Schedule; color: string }) {
  return <article className={styles.professionalBlock}><div className={styles.professionalHeader}><div className={`${styles.professionalAvatar} ${styles[color]}`}>{schedule.professional.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div><div><h3>{schedule.professional}</h3><span><Stethoscope size={14} /> Medicina general</span></div><div className={styles.blockSummary}><strong>{schedule.appointments.length} {schedule.appointments.length === 1 ? "cita" : "citas"}</strong><span>{schedule.free_slots.length} espacios libres</span></div></div><div className={styles.timeline}>{schedule.appointments.length === 0 ? <div className={styles.noAppointments}>Sin citas programadas para este profesional.</div> : schedule.appointments.map((appointment) => <div className={styles.appointmentRow} key={appointment.id}><time>{formatTime(appointment.starts_at)}</time><div className={`${styles.appointmentCard} ${styles[color]}`}><div><strong>{appointment.status === "ATTENDED" ? "Atención registrada" : "Consulta veterinaria"}</strong><span>{statusLabels[appointment.status]} · Mascota #{appointment.pet}</span></div><span className={styles.appointmentTime}>{formatTime(appointment.starts_at)} — {formatTime(appointment.ends_at)}</span></div></div>)}</div>{schedule.free_slots.slice(0, 3).map((slot) => <div className={styles.freeSlot} key={`${slot.starts_at}-${slot.ends_at}`}><Clock3 size={14} /><span>Disponible</span><time>{formatTime(slot.starts_at)} — {formatTime(slot.ends_at)}</time><button aria-label="Agendar en este espacio">Agendar <Plus size={13} /></button></div>)}</article>;
}

function CalendarBoard({ agenda, onAppointmentClick }: { agenda: AgendaResponse | null; onAppointmentClick: (appointment: Appointment) => void }) {
  const slots = Array.from({ length: 21 }, (_, index) => {
    const totalMinutes = 8 * 60 + index * 30;
    return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
  });
  return <section className={styles.calendarBoard} style={{ "--professional-count": String(Math.max(agenda?.schedules.length || 1, 1)) } as React.CSSProperties} aria-label="Calendario diario por profesional"><div className={styles.calendarHeader}><div className={styles.timeHeader}>Hora</div>{agenda?.schedules.map((schedule, index) => <div className={`${styles.calendarProfessional} ${styles[colors[index % colors.length]]}`} key={schedule.professional_id}><strong>{schedule.professional}</strong><span>{schedule.appointments.length} citas · {schedule.free_slots.length} libres</span></div>)}</div><div className={styles.calendarBody}><div className={styles.timeColumn}>{slots.slice(0, -1).map((slot) => <div className={styles.timeCell} key={slot}>{slot}</div>)}</div>{agenda?.schedules.map((schedule, index) => <div className={styles.professionalColumn} key={schedule.professional_id}><div className={styles.slotGrid}>{slots.slice(0, -1).map((slot) => <div className={styles.openCell} key={slot}><span>Libre</span></div>)}{schedule.appointments.map((appointment) => { const start = new Date(appointment.starts_at); const end = new Date(appointment.ends_at); const startMinutes = start.getHours() * 60 + start.getMinutes(); const endMinutes = end.getHours() * 60 + end.getMinutes(); const rowStart = Math.max(1, (startMinutes - 8 * 60) / 30 + 1); const rowSpan = Math.max(1, (endMinutes - startMinutes) / 30); return <button className={`${styles.calendarAppointment} ${styles[colors[index % colors.length]]} ${appointment.status === "ATTENDED" ? styles.attended : ""}`} key={appointment.id} style={{ gridRow: `${rowStart} / span ${rowSpan}` }} onClick={() => onAppointmentClick(appointment)}><strong>{appointment.status === "ATTENDED" ? "Atención registrada" : "Cita programada"}</strong><span>Mascota #{appointment.pet}</span><small>{formatTime(appointment.starts_at)} — {formatTime(appointment.ends_at)}</small></button>; })}</div></div>)}</div><div className={styles.calendarLegend}><span><i className={styles.legendFree} /> Espacio libre</span><span><i className={styles.legendBooked} /> Cita ocupada</span><span><i className={styles.legendAttended} /> Atención realizada</span></div></section>;
}

function AppointmentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ pet: "", professional: "", consultation_type: "", starts_at: "" });
  const [pets, setPets] = useState<PetOption[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalOption[]>([]);
  const [consultationTypes, setConsultationTypes] = useState<ConsultationOption[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/pets/").then((response) => response.json()),
      fetch("/api/professionals/").then((response) => response.json()),
      fetch("/api/consultation-types/").then((response) => response.json()),
    ]).then(([petData, professionalData, consultationData]) => {
      setPets(petData.filter((pet: PetOption) => pet.vital_status === "ALIVE" && pet.is_active !== false));
      setProfessionals(professionalData.filter((professional: ProfessionalOption & { is_active?: boolean }) => professional.is_active !== false));
      setConsultationTypes(consultationData);
    }).catch(() => setError("No fue posible cargar las opciones desde la base de datos."));
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/appointments/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, starts_at: new Date(form.starts_at).toISOString() }) });
      if (!response.ok) { const data = await response.json().catch(() => null); throw new Error(data?.detail?.[0] ?? "No se pudo crear la cita."); }
      onCreated();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "No se pudo crear la cita."); } finally { setSaving(false); }
  }

  return <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="new-appointment-title"><div className={styles.modalHeader}><div><span className={styles.eyebrow}>AGENDA</span><h2 id="new-appointment-title">Nueva cita</h2></div><button className={styles.iconButton} onClick={onClose} aria-label="Cerrar"><X size={18} /></button></div><form onSubmit={submit} className={styles.form}><SearchableSelect label="Mascota" placeholder="Buscar mascota..." value={form.pet} options={pets.map((pet) => ({ value: String(pet.id), label: `${pet.name} · ${pet.species}`, detail: pet.breed || "Sin raza registrada" }))} onChange={(value) => setForm({ ...form, pet: value })} /><SearchableSelect label="Profesional" placeholder="Buscar profesional..." value={form.professional} options={professionals.map((professional) => ({ value: String(professional.id), label: professional.full_name, detail: professional.specialty || "Medicina general" }))} onChange={(value) => setForm({ ...form, professional: value })} /><SearchableSelect label="Tipo de consulta" placeholder="Buscar tipo de consulta..." value={form.consultation_type} options={consultationTypes.map((consultation) => ({ value: String(consultation.id), label: consultation.name, detail: `${consultation.duration_minutes} minutos` }))} onChange={(value) => setForm({ ...form, consultation_type: value })} /><label>Inicio<input required type="datetime-local" value={form.starts_at} onChange={(event) => setForm({ ...form, starts_at: event.target.value })} /></label>{error && <div className={styles.formError}><CircleAlert size={16} />{error}</div>}<button className={styles.primaryButton} disabled={saving || !pets.length || !professionals.length || !consultationTypes.length}>{saving ? "Guardando..." : "Crear cita"}</button></form></section></div>;
}

function AppointmentDetailModal({ appointment, onClose, onSaved }: { appointment: Appointment; onClose: () => void; onSaved: () => void }) {
  const [startsAt, setStartsAt] = useState(appointment.starts_at.slice(0, 16));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function reschedule(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch(`/api/appointments/${appointment.id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pet: appointment.pet, professional: appointment.professional, consultation_type: appointment.consultation_type, starts_at: new Date(startsAt).toISOString(), notes: appointment.notes || "" }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(Object.values(body || {}).flat().join(" ") || "No se pudo reagendar la cita.");
      setSaving(false);
      return;
    }
    onSaved();
  }

  return <div className={styles.modalBackdrop} role="presentation"><section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="appointment-detail-title"><div className={styles.modalHeader}><div><span className={styles.eyebrow}>DETALLE DE CITA</span><h2 id="appointment-detail-title">Cita #{appointment.id}</h2></div><button className={styles.iconButton} onClick={onClose} aria-label="Cerrar"><X size={18} /></button></div><div className={styles.appointmentDetail}><div><span>Estado</span><strong>{statusLabels[appointment.status]}</strong></div><div><span>Mascota</span><strong>#{appointment.pet}</strong></div><div><span>Profesional</span><strong>#{appointment.professional}</strong></div><div><span>Tipo de consulta</span><strong>#{appointment.consultation_type}</strong></div></div>{appointment.status === "SCHEDULED" ? <form onSubmit={reschedule} className={styles.form}><label>Nuevo día y hora<input required type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></label><small className={styles.modalHint}>La duración se conserva desde el tipo de consulta y el backend volverá a validar el solapamiento.</small>{error && <div className={styles.formError}><CircleAlert size={16} />{error}</div>}<button className={styles.primaryButton} disabled={saving}>{saving ? "Guardando..." : "Reagendar cita"}</button></form> : <div className={styles.detailNotice}>Esta cita no está programada y no puede reagendarse.</div>}</section></div>;
}

function SearchableSelect({ label, placeholder, value, options, onChange }: { label: string; placeholder: string; value: string; options: { value: string; label: string; detail: string }[]; onChange: (value: string) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  const filteredOptions = options.filter((option) => `${option.label} ${option.detail}`.toLowerCase().includes(query.toLowerCase()));
  return <div className={styles.searchableField}><label>{label}<div className={styles.searchInputWrap}><Search size={15} /><input required={!value} value={open ? query : selected?.label || ""} placeholder={placeholder} onFocus={() => { setOpen(true); setQuery(""); }} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} onBlur={() => setTimeout(() => setOpen(false), 150)} /></div></label>{open && <div className={styles.searchOptions}>{filteredOptions.length ? filteredOptions.map((option) => <button type="button" key={option.value} onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(option.value); setQuery(""); setOpen(false); }}><strong>{option.label}</strong><span>{option.detail}</span></button>) : <span className={styles.noOptions}>No hay coincidencias</span>}</div>}</div>;
}
