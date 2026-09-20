"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Edit3, PawPrint, Plus, Search, Stethoscope, Trash2, UserRound, X } from "lucide-react";
import Link from "next/link";
import styles from "./gestion.module.css";

type Owner = { id: number; full_name: string; identification: string | null; phone: string; email: string; address: string; is_active: boolean };
type Pet = { id: number; owner: number; name: string; species: string; breed: string; sex: string; birth_date: string | null; vital_status: "ALIVE" | "DECEASED"; death_date: string | null; notes: string; is_active: boolean };
type Professional = { id: number; full_name: string; professional_id: string; specialty: string; phone: string; email: string; is_active: boolean };
type Section = "owners" | "pets" | "professionals";

const labels: Record<Section, string> = { owners: "Propietarios", pets: "Mascotas", professionals: "Profesionales" };
const emptyForms = {
  owners: { full_name: "", identification: "", phone: "", email: "", address: "", is_active: true },
  pets: { owner: "", name: "", species: "", breed: "", sex: "", birth_date: "", vital_status: "ALIVE", death_date: "", notes: "", is_active: true },
  professionals: { full_name: "", professional_id: "", specialty: "", phone: "", email: "", is_active: true },
};

export default function ManagementPage() {
  const [section, setSection] = useState<Section>("owners");
  const [owners, setOwners] = useState<Owner[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState<{ section: Section; item: Owner | Pet | Professional | null } | null>(null);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const responses = await Promise.all([fetch("/api/owners/"), fetch("/api/pets/"), fetch("/api/professionals/")]);
      if (responses.some((response) => !response.ok)) throw new Error("No fue posible cargar los registros.");
      setOwners(await responses[0].json());
      setPets(await responses[1].json());
      setProfessionals(await responses[2].json());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No fue posible cargar los registros.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const currentItems = useMemo(() => {
    const normalized = search.toLowerCase();
    if (section === "owners") return owners.filter((item) => `${item.full_name} ${item.phone} ${item.email}`.toLowerCase().includes(normalized));
    if (section === "pets") return pets.filter((item) => `${item.name} ${item.species} ${item.breed}`.toLowerCase().includes(normalized));
    return professionals.filter((item) => `${item.full_name} ${item.specialty} ${item.professional_id}`.toLowerCase().includes(normalized));
  }, [owners, pets, professionals, search, section]);

  async function removeItem(item: Owner | Pet | Professional) {
    if (!window.confirm(`¿Eliminar ${displayName(section, item)}?`)) return;
    setError("");
    const response = await fetch(`/api/${section}/${item.id}/`, { method: "DELETE" });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.detail || "No se puede eliminar este registro porque tiene información relacionada.");
      return;
    }
    loadData();
  }

  return <main className={styles.shell}><aside className={styles.sidebar}><Link href="/" className={styles.brand}><span className={styles.brandMark}><PawPrint size={19} /></span><span>vetline</span></Link><div className={styles.sideIntro}><span>ADMINISTRACIÓN</span><strong>Catálogos de clínica</strong><p>Gestiona las personas y pacientes que alimentan la agenda.</p></div><nav className={styles.sideNav}><Link href="/"><ArrowLeft size={17} /> Volver a agenda</Link><button className={section === "owners" ? styles.selected : ""} onClick={() => setSection("owners")}><UserRound size={17} /> Propietarios</button><button className={section === "pets" ? styles.selected : ""} onClick={() => setSection("pets")}><PawPrint size={17} /> Mascotas</button><button className={section === "professionals" ? styles.selected : ""} onClick={() => setSection("professionals")}><Stethoscope size={17} /> Profesionales</button></nav><div className={styles.sideNote}>Los cambios se guardan directamente en PostgreSQL a través de la API Django.</div></aside><section className={styles.content}><header className={styles.header}><div><span className={styles.eyebrow}>DATOS MAESTROS</span><h1>{labels[section]}</h1><p>Registros activos y datos de contacto de la clínica.</p></div><button className={styles.primaryButton} onClick={() => setEditor({ section, item: null })}><Plus size={17} /> Nuevo {singular(section)}</button></header><div className={styles.toolbar}><div className={styles.search}><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Buscar ${labels[section].toLowerCase()}...`} /></div><span className={styles.total}>{currentItems.length} registros</span></div>{error && <div className={styles.error}>{error}</div>}{loading ? <div className={styles.loading}>Cargando registros...</div> : <RecordsTable section={section} items={currentItems} owners={owners} onEdit={(item) => setEditor({ section, item })} onDelete={removeItem} />}</section>{editor && <EditorModal section={editor.section} item={editor.item} owners={owners} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); loadData(); }} />}</main>;
}

function RecordsTable({ section, items, owners, onEdit, onDelete }: { section: Section; items: (Owner | Pet | Professional)[]; owners: Owner[]; onEdit: (item: Owner | Pet | Professional) => void; onDelete: (item: Owner | Pet | Professional) => void }) {
  if (!items.length) return <div className={styles.empty}><PawPrint size={24} /><strong>No hay registros todavía</strong><span>Usa “Nuevo {singular(section)}” para crear el primero.</span></div>;
  return <div className={styles.tableWrap}><table><thead><tr>{section === "owners" ? <><th>Propietario</th><th>Contacto</th><th>Estado</th></> : section === "pets" ? <><th>Mascota</th><th>Especie</th><th>Propietario</th><th>Estado vital</th></> : <><th>Profesional</th><th>Especialidad</th><th>Identificación</th><th>Estado</th></>}<th aria-label="Acciones" /></tr></thead><tbody>{items.map((item) => <tr key={item.id}>{section === "owners" && <><td><strong>{(item as Owner).full_name}</strong><small>ID #{item.id}</small></td><td>{(item as Owner).phone}<small>{(item as Owner).email || "Sin correo"}</small></td><td><Status active={(item as Owner).is_active} /></td></>}{section === "pets" && <><td><strong>{(item as Pet).name}</strong><small>ID #{item.id}</small></td><td>{(item as Pet).species}<small>{(item as Pet).breed || "Raza no registrada"}</small></td><td>{owners.find((owner) => owner.id === (item as Pet).owner)?.full_name || `Propietario #${(item as Pet).owner}`}</td><td><span className={(item as Pet).vital_status === "DECEASED" ? styles.badgeDead : styles.badgeAlive}>{(item as Pet).vital_status === "DECEASED" ? "Fallecida" : "Viva"}</span></td></>}{section === "professionals" && <><td><strong>{(item as Professional).full_name}</strong><small>{(item as Professional).email || "Sin correo"}</small></td><td>{(item as Professional).specialty || "General"}</td><td>{(item as Professional).professional_id}</td><td><Status active={(item as Professional).is_active} /></td></>}<td><div className={styles.actions}><button onClick={() => onEdit(item)} aria-label="Editar"><Edit3 size={15} /></button><button onClick={() => onDelete(item)} aria-label="Eliminar"><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>;
}

function Status({ active }: { active: boolean }) { return <span className={active ? styles.badgeAlive : styles.badgeInactive}>{active ? "Activo" : "Inactivo"}</span>; }
function singular(section: Section) { return section === "owners" ? "propietario" : section === "pets" ? "mascota" : "profesional"; }
function displayName(section: Section, item: Owner | Pet | Professional) { return section === "pets" ? (item as Pet).name : (item as Owner | Professional).full_name; }

function EditorModal({ section, item, owners, onClose, onSaved }: { section: Section; item: Owner | Pet | Professional | null; owners: Owner[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Record<string, string | boolean>>(() => {
    const normalizedItem = item
      ? Object.fromEntries(Object.entries(item).map(([key, value]) => [key, typeof value === "number" ? String(value) : value]))
      : {};
    return { ...emptyForms[section], ...normalizedItem, owner: item && "owner" in item ? String(item.owner) : "" } as Record<string, string | boolean>;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEditing = Boolean(item);
  const update = (key: string, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = { ...form } as Record<string, string | boolean | number | null>;
    if (section === "pets") { payload.owner = Number(payload.owner); payload.birth_date = payload.birth_date || null; payload.death_date = payload.vital_status === "DECEASED" ? payload.death_date || null : null; }
    const response = await fetch(`/api/${section}/${isEditing ? `${item?.id}/` : ""}`, { method: isEditing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!response.ok) { const body = await response.json().catch(() => null); setError(Object.values(body || {}).flat().join(" ") || "No se pudo guardar el registro."); setSaving(false); return; }
    onSaved();
  }

  return <div className={styles.backdrop} role="presentation"><section className={styles.modal} role="dialog" aria-modal="true"><header><div><span className={styles.eyebrow}>{isEditing ? "EDITAR" : "NUEVO REGISTRO"}</span><h2>{isEditing ? `Editar ${singular(section)}` : `Nuevo ${singular(section)}`}</h2></div><button onClick={onClose} aria-label="Cerrar"><X size={18} /></button></header><form onSubmit={submit}>{section === "owners" && <><Field label="Nombre completo" value={form.full_name as string} onChange={(value) => update("full_name", value)} required /><Field label="Identificación" value={form.identification as string} onChange={(value) => update("identification", value)} /><Field label="Teléfono" value={form.phone as string} onChange={(value) => update("phone", value)} required /><Field label="Correo" type="email" value={form.email as string} onChange={(value) => update("email", value)} /><Field label="Dirección" value={form.address as string} onChange={(value) => update("address", value)} /></>}{section === "pets" && <><label>Propietario<select required value={form.owner as string} onChange={(event) => update("owner", event.target.value)}><option value="">Seleccionar propietario</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.full_name}</option>)}</select></label><Field label="Nombre de la mascota" value={form.name as string} onChange={(value) => update("name", value)} required /><div className={styles.grid}><Field label="Especie" value={form.species as string} onChange={(value) => update("species", value)} required /><Field label="Raza" value={form.breed as string} onChange={(value) => update("breed", value)} /></div><div className={styles.grid}><Field label="Sexo" value={form.sex as string} onChange={(value) => update("sex", value)} /><Field label="Nacimiento" type="date" value={form.birth_date as string} onChange={(value) => update("birth_date", value)} /></div><label>Estado vital<select value={form.vital_status as string} onChange={(event) => update("vital_status", event.target.value)}><option value="ALIVE">Viva</option><option value="DECEASED">Fallecida</option></select></label>{form.vital_status === "DECEASED" && <Field label="Fecha de fallecimiento" type="date" value={form.death_date as string} onChange={(value) => update("death_date", value)} required />}</>}{section === "professionals" && <><Field label="Nombre completo" value={form.full_name as string} onChange={(value) => update("full_name", value)} required /><Field label="Identificación profesional" value={form.professional_id as string} onChange={(value) => update("professional_id", value)} required /><Field label="Especialidad" value={form.specialty as string} onChange={(value) => update("specialty", value)} /><div className={styles.grid}><Field label="Teléfono" value={form.phone as string} onChange={(value) => update("phone", value)} /><Field label="Correo" type="email" value={form.email as string} onChange={(value) => update("email", value)} /></div></>}{error && <p className={styles.formError}>{error}</p>}<footer><button type="button" className={styles.secondaryButton} onClick={onClose}>Cancelar</button><button className={styles.primaryButton} disabled={saving}>{saving ? "Guardando..." : "Guardar registro"}</button></footer></form></section></div>;
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) { return <label>{label}<input required={required} type={type} value={value || ""} onChange={(event) => onChange(event.target.value)} /></label>; }
