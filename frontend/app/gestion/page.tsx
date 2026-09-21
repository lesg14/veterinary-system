"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Edit3,
  FileText,
  PawPrint,
  Plus,
  Search,
  Stethoscope,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import styles from "./gestion.module.css";

type Owner = {
  id: number;
  full_name: string;
  identification_type: "CC" | "CE" | "PASSPORT" | "NIT";
  identification: string | null;
  phone: string;
  email: string;
  address: string;
  is_active: boolean;
};
type Pet = {
  id: number;
  owner: number;
  name: string;
  species: number;
  species_name: string;
  breed: number;
  breed_name: string;
  sex: string;
  birth_date: string | null;
  vital_status: "ALIVE" | "DECEASED";
  death_date: string | null;
  notes: string;
  is_active: boolean;
};
type Professional = {
  id: number;
  full_name: string;
  identification_type: "CC" | "CE" | "PASSPORT" | "NIT";
  professional_id: string;
  specialty: string;
  phone: string;
  email: string;
  is_active: boolean;
};
type ConsultationType = {
  id: number;
  name: string;
  description: string;
  duration_minutes: number;
  is_active: boolean;
};
type Species = { id: number; name: string; is_active: boolean };
type Breed = { id: number; species: number; species_name: string; name: string; is_active: boolean };
type Section = "owners" | "pets" | "professionals" | "consultation-types" | "species" | "breeds";

const labels: Record<Section, string> = {
  owners: "Propietarios",
  pets: "Mascotas",
  professionals: "Profesionales",
  "consultation-types": "Tipos de consulta",
  species: "Especies",
  breeds: "Razas",
};
const emptyForms = {
  owners: {
    full_name: "",
    identification_type: "CC",
    identification: "",
    phone: "",
    email: "",
    address: "",
    is_active: true,
  },
  pets: {
    owner: "",
    name: "",
    species: "",
    breed: "",
    sex: "",
    birth_date: "",
    vital_status: "ALIVE",
    death_date: "",
    notes: "",
    is_active: true,
  },
  professionals: {
    full_name: "",
    identification_type: "CC",
    professional_id: "",
    specialty: "",
    phone: "",
    email: "",
    is_active: true,
  },
  "consultation-types": {
    name: "",
    description: "",
    duration_minutes: "30",
    is_active: true,
  },
  species: { name: "", is_active: true },
  breeds: { species: "", name: "", is_active: true },
};

export default function ManagementPage() {
  const [section, setSection] = useState<Section>("owners");
  const [owners, setOwners] = useState<Owner[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [consultationTypes, setConsultationTypes] = useState<
    ConsultationType[]
  >([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState<{
    section: Section;
    item: Owner | Pet | Professional | ConsultationType | Species | Breed | null;
  } | null>(null);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const responses = await Promise.all([
        fetch("/api/owners/"),
        fetch("/api/pets/"),
        fetch("/api/professionals/"),
        fetch("/api/consultation-types/"),
        fetch("/api/species/"),
        fetch("/api/breeds/"),
      ]);
      if (responses.some((response) => !response.ok))
        throw new Error("No fue posible cargar los registros.");
      setOwners(await responses[0].json());
      setPets(await responses[1].json());
      setProfessionals(await responses[2].json());
      setConsultationTypes(await responses[3].json());
      setSpecies(await responses[4].json());
      setBreeds(await responses[5].json());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No fue posible cargar los registros.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const currentItems = useMemo(() => {
    const normalized = search.toLowerCase();
    if (section === "owners")
      return owners.filter((item) =>
        `${item.full_name} ${item.phone} ${item.email}`
          .toLowerCase()
          .includes(normalized),
      );
    if (section === "pets")
      return pets.filter((item) =>
        `${item.name} ${item.species_name} ${item.breed_name}`
          .toLowerCase()
          .includes(normalized),
      );
    if (section === "professionals")
      return professionals.filter((item) =>
        `${item.full_name} ${item.specialty} ${item.professional_id}`
          .toLowerCase()
          .includes(normalized),
      );
    if (section === "consultation-types")
      return consultationTypes.filter((item) =>
        `${item.name} ${item.description}`.toLowerCase().includes(normalized),
      );
    if (section === "species")
      return species.filter((item) => item.name.toLowerCase().includes(normalized));
    return breeds.filter((item) =>
      (speciesFilter === "all" || String(item.species) === speciesFilter) &&
      `${item.name} ${item.species_name}`.toLowerCase().includes(normalized),
    );
  }, [owners, pets, professionals, consultationTypes, species, breeds, search, speciesFilter, section]);

  async function removeItem(
    item: Owner | Pet | Professional | ConsultationType | Species | Breed,
  ) {
    if (!window.confirm(`¿Eliminar ${displayName(section, item)}?`)) return;
    setError("");
    const response = await fetch(`/api/${section}/${item.id}/`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(
        body?.detail ||
          "No se puede eliminar este registro porque tiene información relacionada.",
      );
      return;
    }
    loadData();
  }

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
          <span>ADMINISTRACIÓN</span>
          <strong>Catálogos de clínica</strong>
          <p>Gestiona las personas y pacientes que alimentan la agenda.</p>
        </div>
        <nav className={styles.sideNav}>
          <Link href="/">
            <ArrowLeft size={17} /> Volver a agenda
          </Link>
          <button
            className={section === "owners" ? styles.selected : ""}
            onClick={() => setSection("owners")}
          >
            <UserRound size={17} /> Propietarios
          </button>
          <button
            className={section === "pets" ? styles.selected : ""}
            onClick={() => setSection("pets")}
          >
            <PawPrint size={17} /> Mascotas
          </button>
          <button
            className={section === "professionals" ? styles.selected : ""}
            onClick={() => setSection("professionals")}
          >
            <Stethoscope size={17} /> Profesionales
          </button>
          <button
            className={section === "consultation-types" ? styles.selected : ""}
            onClick={() => setSection("consultation-types")}
          >
            <FileText size={17} /> Tipos de consulta
          </button>
          <button className={section === "species" ? styles.selected : ""} onClick={() => setSection("species")}>
            <PawPrint size={17} /> Especies
          </button>
          <button className={section === "breeds" ? styles.selected : ""} onClick={() => setSection("breeds")}>
            <PawPrint size={17} /> Razas
          </button>
        </nav>
        <div className={styles.sideNote}>
          Los cambios se guardan directamente en PostgreSQL a través de la API
          Django.
        </div>
      </aside>
      <section className={styles.content}>
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>DATOS MAESTROS</span>
            <h1>{labels[section]}</h1>
            <p>
              {section === "consultation-types"
                ? "Configura duración y descripción de cada consulta."
                : section === "species" || section === "breeds"
                  ? "Administra los catálogos que alimentan el registro de mascotas."
                : "Registros activos y datos de contacto de la clínica."}
            </p>
          </div>
          <button
            className={styles.primaryButton}
            onClick={() => setEditor({ section, item: null })}
          >
            <Plus size={17} /> Nuevo {singular(section)}
          </button>
        </header>
        <div className={styles.toolbar}>
          <div className={styles.search}>
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Buscar ${labels[section].toLowerCase()}...`}
            />
          </div>
          {section === "breeds" && (
            <select value={speciesFilter} onChange={(event) => setSpeciesFilter(event.target.value)}>
              <option value="all">Todas las especies</option>
              {species.map((record) => <option key={record.id} value={record.id}>{record.name}</option>)}
            </select>
          )}
          <span className={styles.total}>{currentItems.length} registros</span>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        {loading ? (
          <div className={styles.loading}>Cargando registros...</div>
        ) : (
          <RecordsTable
            section={section}
            items={currentItems}
            owners={owners}
            species={species}
            onEdit={(item) => setEditor({ section, item })}
            onDelete={removeItem}
          />
        )}
      </section>
      {editor && (
        <EditorModal
          section={editor.section}
          item={editor.item}
          owners={owners}
          species={species}
          breeds={breeds}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            loadData();
          }}
        />
      )}
    </main>
  );
}

function RecordsTable({
  section,
  items,
  owners,
  species,
  onEdit,
  onDelete,
}: {
  section: Section;
  items: (Owner | Pet | Professional | ConsultationType | Species | Breed)[];
  owners: Owner[];
  species: Species[];
  onEdit: (item: Owner | Pet | Professional | ConsultationType | Species | Breed) => void;
  onDelete: (item: Owner | Pet | Professional | ConsultationType | Species | Breed) => void;
}) {
  if (!items.length)
    return (
      <div className={styles.empty}>
        <PawPrint size={24} />
        <strong>No hay registros todavía</strong>
        <span>Usa “Nuevo {singular(section)}” para crear el primero.</span>
      </div>
    );
  if (section === "consultation-types")
    return (
      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>Tipo de consulta</th>
              <th>Descripción</th>
              <th>Duración</th>
              <th>Estado</th>
              <th aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const consultation = item as ConsultationType;
              return (
                <tr key={consultation.id}>
                  <td>
                    <strong>{consultation.name}</strong>
                    <small>ID #{consultation.id}</small>
                  </td>
                  <td>{consultation.description || "Sin descripción"}</td>
                  <td>{consultation.duration_minutes} minutos</td>
                  <td>
                    <Status active={consultation.is_active} />
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        onClick={() => onEdit(consultation)}
                        aria-label="Editar"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => onDelete(consultation)}
                        aria-label="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  if (section === "species")
    return (
      <div className={styles.tableWrap}>
        <table>
          <thead><tr><th>Especie</th><th>Estado</th><th aria-label="Acciones" /></tr></thead>
          <tbody>{items.map((item) => { const record = item as Species; return <tr key={record.id}><td><strong>{record.name}</strong><small>ID #{record.id}</small></td><td><Status active={record.is_active} /></td><td><div className={styles.actions}><button onClick={() => onEdit(record)} aria-label="Editar"><Edit3 size={15} /></button><button onClick={() => onDelete(record)} aria-label="Eliminar"><Trash2 size={15} /></button></div></td></tr>; })}</tbody>
        </table>
      </div>
    );
  if (section === "breeds")
    return (
      <div className={styles.tableWrap}>
        <table>
          <thead><tr><th>Raza</th><th>Especie</th><th>Estado</th><th aria-label="Acciones" /></tr></thead>
          <tbody>{items.map((item) => { const record = item as Breed; return <tr key={record.id}><td><strong>{record.name}</strong><small>ID #{record.id}</small></td><td>{record.species_name}</td><td><Status active={record.is_active} /></td><td><div className={styles.actions}><button onClick={() => onEdit(record)} aria-label="Editar"><Edit3 size={15} /></button><button onClick={() => onDelete(record)} aria-label="Eliminar"><Trash2 size={15} /></button></div></td></tr>; })}</tbody>
        </table>
      </div>
    );
  return (
    <div className={styles.tableWrap}>
      <table>
        <thead>
          <tr>
            {section === "owners" ? (
              <>
                <th>Propietario</th>
                <th>Contacto</th>
                <th>Estado</th>
              </>
            ) : section === "pets" ? (
              <>
                <th>Mascota</th>
                <th>Especie</th>
                <th>Propietario</th>
                <th>Estado vital</th>
              </>
            ) : (
              <>
                <th>Profesional</th>
                <th>Especialidad</th>
                <th>Identificación</th>
                <th>Estado</th>
              </>
            )}
            <th aria-label="Acciones" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              {section === "owners" && (
                <>
                  <td>
                    <strong>{(item as Owner).full_name}</strong>
                    <small>ID #{item.id}</small>
                  </td>
                  <td>
                    {(item as Owner).phone}
                    <small>{(item as Owner).email || "Sin correo"}</small>
                  </td>
                  <td>
                    <Status active={(item as Owner).is_active} />
                  </td>
                </>
              )}
              {section === "pets" && (
                <>
                  <td>
                    <strong>{(item as Pet).name}</strong>
                    <small>ID #{item.id}</small>
                  </td>
                  <td>
                    {(item as Pet).species_name}
                    <small>{(item as Pet).breed_name}</small>
                  </td>
                  <td>
                    {owners.find((owner) => owner.id === (item as Pet).owner)
                      ?.full_name || `Propietario #${(item as Pet).owner}`}
                  </td>
                  <td>
                    <span
                      className={
                        (item as Pet).vital_status === "DECEASED"
                          ? styles.badgeDead
                          : styles.badgeAlive
                      }
                    >
                      {(item as Pet).vital_status === "DECEASED"
                        ? "Fallecida"
                        : "Viva"}
                    </span>
                  </td>
                </>
              )}
              {section === "professionals" && (
                <>
                  <td>
                    <strong>{(item as Professional).full_name}</strong>
                    <small>
                      {(item as Professional).email || "Sin correo"}
                    </small>
                  </td>
                  <td>{(item as Professional).specialty || "General"}</td>
                  <td>{(item as Professional).professional_id}</td>
                  <td>
                    <Status active={(item as Professional).is_active} />
                  </td>
                </>
              )}
              <td>
                <div className={styles.actions}>
                  <button onClick={() => onEdit(item)} aria-label="Editar">
                    <Edit3 size={15} />
                  </button>
                  <button onClick={() => onDelete(item)} aria-label="Eliminar">
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Status({ active }: { active: boolean }) {
  return (
    <span className={active ? styles.badgeAlive : styles.badgeInactive}>
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}
function singular(section: Section) {
  return section === "owners"
    ? "propietario"
    : section === "pets"
      ? "mascota"
      : section === "professionals"
        ? "profesional"
        : section === "consultation-types"
          ? "tipo de consulta"
          : section === "species"
            ? "especie"
            : "raza";
}
function displayName(
  section: Section,
  item: Owner | Pet | Professional | ConsultationType | Species | Breed,
) {
  return section === "pets"
    ? (item as Pet).name
    : section === "consultation-types"
      ? (item as ConsultationType).name
      : section === "species"
        ? (item as Species).name
        : section === "breeds"
          ? (item as Breed).name
          : (item as Owner | Professional).full_name;
}

function EditorModal({
  section,
  item,
  owners,
  species,
  breeds,
  onClose,
  onSaved,
}: {
  section: Section;
  item: Owner | Pet | Professional | ConsultationType | Species | Breed | null;
  owners: Owner[];
  species: Species[];
  breeds: Breed[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Record<string, string | boolean>>(() => {
    const normalizedItem = item
      ? Object.fromEntries(
          Object.entries(item).map(([key, value]) => [
            key,
            typeof value === "number" ? String(value) : value,
          ]),
        )
      : {};
    return {
      ...emptyForms[section],
      ...normalizedItem,
      owner: item && "owner" in item ? String(item.owner) : "",
    } as Record<string, string | boolean>;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEditing = Boolean(item);
  const filteredBreeds = breeds.filter(
    (record) => String(record.species) === String(form.species) && record.is_active,
  );
  const update = (key: string, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));
  const capitalizeWords = (value: string) =>
    value.replace(/[^\p{L}\s'-]/gu, "").replace(/\s+/g, " ").replace(/(^|[\s'-])\p{L}/gu, (letter) => letter.toUpperCase());

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (section === "pets") {
      const speciesId = Number(form.species);
      const breedId = Number(form.breed);
      if (!speciesId) {
        setError("Selecciona una especie.");
        return;
      }
      if (!breedId) {
        setError("Selecciona una raza.");
        return;
      }
    }
    setSaving(true);
    const payload = { ...form } as Record<
      string,
      string | boolean | number | null
    >;
    if (section === "pets") {
      payload.owner = Number(payload.owner);
      payload.birth_date = payload.birth_date || null;
      payload.death_date =
        payload.vital_status === "DECEASED" ? payload.death_date || null : null;
    }
    const response = await fetch(
      `/api/${section}/${isEditing ? `${item?.id}/` : ""}`,
      {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(
        Object.values(body || {})
          .flat()
          .join(" ") || "No se pudo guardar el registro.",
      );
      setSaving(false);
      return;
    }
    onSaved();
  }

  if (section === "consultation-types")
    return (
      <ConsultationTypeModal
        item={item as ConsultationType | null}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  if (section === "species" || section === "breeds")
    return <CatalogEditor section={section} item={item as Species | Breed | null} species={species} onClose={onClose} onSaved={onSaved} />;
  return (
    <div className={styles.backdrop} role="presentation">
      <section className={styles.modal} role="dialog" aria-modal="true">
        <header>
          <div>
            <span className={styles.eyebrow}>
              {isEditing ? "EDITAR" : "NUEVO REGISTRO"}
            </span>
            <h2>
              {isEditing
                ? `Editar ${singular(section)}`
                : `Nuevo ${singular(section)}`}
            </h2>
          </div>
          <button onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>
        <form onSubmit={submit}>
          {section === "owners" && (
            <>
              <Field
                label="Nombre completo"
                value={form.full_name as string}
                onChange={(value) => update("full_name", capitalizeWords(value))}
                required
              />
              <label>
                Tipo de identificación
                <select required value={form.identification_type as string} onChange={(event) => update("identification_type", event.target.value)}>
                  <option value="CC">Cédula de ciudadanía</option>
                  <option value="CE">Cédula de extranjería</option>
                  <option value="PASSPORT">Pasaporte</option>
                  <option value="NIT">NIT</option>
                </select>
              </label>
              <Field
                label="Identificación"
                value={form.identification as string}
                onChange={(value) => update("identification", value.replace(/\D/g, "").slice(0, 10))}
                inputMode="numeric"
                pattern="[0-9]{7,10}"
                minLength={7}
                maxLength={10}
                required
              />
              <Field
                label="Teléfono"
                value={form.phone as string}
                onChange={(value) => update("phone", value.replace(/\D/g, "").slice(0, 10))}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{10}"
                minLength={10}
                maxLength={10}
                required
              />
              <Field
                label="Correo"
                type="email"
                value={form.email as string}
                onChange={(value) => update("email", value)}
              />
              <Field
                label="Dirección"
                value={form.address as string}
                onChange={(value) => update("address", value)}
              />
            </>
          )}
          {section === "pets" && (
            <>
              <label>
                Propietario
                <select
                  required
                  value={form.owner as string}
                  onChange={(event) => update("owner", event.target.value)}
                >
                  <option value="">Seleccionar propietario</option>
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.full_name}
                    </option>
                  ))}
                </select>
              </label>
              <Field
                label="Nombre de la mascota"
                value={form.name as string}
                onChange={(value) => update("name", capitalizeWords(value))}
                required
              />
              <div className={styles.grid}>
                <SearchableCatalogSelect
                  label="Especie"
                  placeholder="Buscar especie..."
                  value={form.species as string}
                  options={species.filter((record) => record.is_active).map((record) => ({ value: String(record.id), label: record.name }))}
                  onChange={(value) => { update("species", value); update("breed", ""); }}
                />
                <SearchableCatalogSelect
                  label="Raza"
                  placeholder={form.species ? "Buscar raza..." : "Selecciona una especie primero"}
                  value={form.breed as string}
                  options={filteredBreeds.map((breed) => ({ value: String(breed.id), label: breed.name }))}
                  onChange={(value) => update("breed", value)}
                />
              </div>
              <div className={styles.grid}>
                <label>Sexo<select value={form.sex as string} onChange={(event) => update("sex", event.target.value)}><option value="">Seleccionar sexo</option><option value="Macho">Macho</option><option value="Hembra">Hembra</option></select></label>
                <Field
                  label="Nacimiento"
                  type="date"
                  value={form.birth_date as string}
                  onChange={(value) => update("birth_date", value)}
                />
              </div>
              <label>
                Estado vital
                <select
                  value={form.vital_status as string}
                  onChange={(event) =>
                    update("vital_status", event.target.value)
                  }
                >
                  <option value="ALIVE">Viva</option>
                  <option value="DECEASED">Fallecida</option>
                </select>
              </label>
              {form.vital_status === "DECEASED" && (
                <Field
                  label="Fecha de fallecimiento"
                  type="date"
                  value={form.death_date as string}
                  onChange={(value) => update("death_date", value)}
                  required
                />
              )}
            </>
          )}
          {section === "professionals" && (
            <>
              <Field
                label="Nombre completo"
                value={form.full_name as string}
                onChange={(value) => update("full_name", capitalizeWords(value))}
                required
              />
              <label>
                Tipo de identificación
                <select required value={form.identification_type as string} onChange={(event) => update("identification_type", event.target.value)}>
                  <option value="CC">Cédula de ciudadanía</option>
                  <option value="CE">Cédula de extranjería</option>
                  <option value="PASSPORT">Pasaporte</option>
                  <option value="NIT">NIT</option>
                </select>
              </label>
              <Field
                label="Número de identificación"
                value={form.professional_id as string}
                onChange={(value) => update("professional_id", value.replace(/\D/g, "").slice(0, 10))}
                inputMode="numeric"
                pattern="[0-9]{7,10}"
                minLength={7}
                maxLength={10}
                required
              />
              <Field
                label="Especialidad"
                value={form.specialty as string}
                onChange={(value) => update("specialty", value)}
              />
              <div className={styles.grid}>
                <Field
                  label="Teléfono"
                  value={form.phone as string}
                  onChange={(value) => update("phone", value.replace(/\D/g, "").slice(0, 10))}
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  minLength={10}
                  maxLength={10}
                  required
                />
                <Field
                  label="Correo"
                  type="email"
                  value={form.email as string}
                  onChange={(value) => update("email", value)}
                  required
                />
              </div>
            </>
          )}
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
              {saving ? "Guardando..." : "Guardar registro"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function CatalogEditor({
  section,
  item,
  species,
  onClose,
  onSaved,
}: {
  section: "species" | "breeds";
  item: Species | Breed | null;
  species: Species[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const editingSpecies = section === "species";
  const current = item as Species | Breed | null;
  const [name, setName] = useState(current?.name || "");
  const [speciesId, setSpeciesId] = useState(String(!editingSpecies && current && "species" in current ? current.species : ""));
  const [isActive, setIsActive] = useState(current?.is_active ?? true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const capitalizeWords = (value: string) => value.replace(/\s+/g, " ").replace(/(^|[\s'-])\p{L}/gu, (letter) => letter.toUpperCase());

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = editingSpecies
      ? { name: name.trim(), is_active: isActive }
      : { name: name.trim(), species: Number(speciesId), is_active: isActive };
    if (!payload.name || (!editingSpecies && !speciesId)) {
      setError(editingSpecies ? "El nombre es obligatorio." : "Selecciona una especie y escribe el nombre de la raza.");
      setSaving(false);
      return;
    }
    const response = await fetch(`/api/${section}/${item ? `${item.id}/` : ""}`, {
      method: item ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(Object.values(body || {}).flat().join(" ") || "No se pudo guardar el catálogo.");
      setSaving(false);
      return;
    }
    onSaved();
  }

  return <div className={styles.backdrop} role="presentation"><section className={styles.modal} role="dialog" aria-modal="true"><header><div><span className={styles.eyebrow}>{item ? "EDITAR" : "NUEVO REGISTRO"}</span><h2>{item ? `Editar ${singular(section)}` : `Nueva ${singular(section)}`}</h2></div><button onClick={onClose} aria-label="Cerrar"><X size={18} /></button></header><form onSubmit={submit}><Field label={editingSpecies ? "Nombre de la especie" : "Nombre de la raza"} value={name} onChange={(value) => setName(capitalizeWords(value))} required />{!editingSpecies && <label>Especie<select required value={speciesId} onChange={(event) => setSpeciesId(event.target.value)}><option value="">Seleccionar especie</option>{species.map((record) => <option key={record.id} value={record.id}>{record.name}</option>)}</select></label>}<label>Estado<select value={isActive ? "true" : "false"} onChange={(event) => setIsActive(event.target.value === "true")}><option value="true">Activo</option><option value="false">Inactivo</option></select></label>{error && <p className={styles.formError}>{error}</p>}<footer><button type="button" className={styles.secondaryButton} onClick={onClose}>Cancelar</button><button className={styles.primaryButton} disabled={saving}>{saving ? "Guardando..." : "Guardar registro"}</button></footer></form></section></div>;
}

function ConsultationTypeModal({
  item,
  onClose,
  onSaved,
}: {
  item: ConsultationType | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: item?.name || "",
    description: item?.description || "",
    duration_minutes: String(item?.duration_minutes || 30),
    is_active: item?.is_active ?? true,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const isOther = form.name.trim().toLowerCase() === "otro";
  const capitalizeWords = (value: string) => value.replace(/\s+/g, " ").replace(/(^|[\s'-])\p{L}/gu, (letter) => letter.toUpperCase());

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch(
      `/api/consultation-types/${item ? `${item.id}/` : ""}`,
      {
        method: item ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          duration_minutes: Number(form.duration_minutes),
          description: isOther ? form.description : form.description,
        }),
      },
    );
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(
        Object.values(body || {})
          .flat()
          .join(" ") || "No se pudo guardar el tipo de consulta.",
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
        aria-labelledby="consultation-type-title"
      >
        <header>
          <div>
            <span className={styles.eyebrow}>
              {item ? "EDITAR" : "NUEVO REGISTRO"}
            </span>
            <h2 id="consultation-type-title">
              {item ? "Editar tipo de consulta" : "Nuevo tipo de consulta"}
            </h2>
          </div>
          <button onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>
        <form onSubmit={submit}>
          <Field
            label="Nombre"
            value={form.name}
            onChange={(value) => setForm({ ...form, name: capitalizeWords(value) })}
            required
          />
          <div className={styles.grid}>
            <Field
              label="Duración (minutos)"
              type="number"
              value={form.duration_minutes}
              inputMode="numeric"
              min={1}
              step={1}
              pattern="[0-9]+"
              onChange={(value) =>
                setForm({ ...form, duration_minutes: value.replace(/\D/g, "") })
              }
              required
            />
            <label>
              Estado
              <select
                value={form.is_active ? "true" : "false"}
                onChange={(event) =>
                  setForm({ ...form, is_active: event.target.value === "true" })
                }
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </label>
          </div>
          {isOther && (
            <label>
              Motivo de la consulta
              <textarea
                required
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                placeholder="Describe el motivo específico de la consulta"
              />
            </label>
          )}
          {!isOther && (
            <Field
              label="Descripción (opcional)"
              value={form.description}
              onChange={(value) => setForm({ ...form, description: value })}
            />
          )}
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
              {saving ? "Guardando..." : "Guardar registro"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function SearchableCatalogSelect({ label, placeholder, value, options, onChange }: { label: string; placeholder: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  const filtered = options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()));
  return <div className={styles.searchableField}><label>{label}<div className={styles.searchInputWrap}><Search size={15} /><input required={!value} value={open ? query : selected?.label || ""} placeholder={placeholder} onFocus={() => { setOpen(true); setQuery(""); }} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} onBlur={() => setTimeout(() => setOpen(false), 150)} /></div></label>{open && <div className={styles.searchOptions}>{filtered.length ? filtered.map((option) => <button type="button" key={option.value} onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(option.value); setQuery(""); setOpen(false); }}><strong>{option.label}</strong></button>) : <span className={styles.noOptions}>No hay coincidencias</span>}</div>}</div>;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  inputMode,
  pattern,
  minLength,
  maxLength,
  min,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  inputMode?: "numeric" | "email" | "tel" | "text";
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  step?: number;
}) {
  return (
    <label>
      {label}
      <input
        required={required}
        type={type}
        inputMode={inputMode}
        pattern={pattern}
        minLength={minLength}
        maxLength={maxLength}
        min={min}
        step={step}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
