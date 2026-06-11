import { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import useSWR from "swr";
import type { Book, Shelf } from "@/lib/db/schema";
import type { LookupResult } from "@/lib/openLibrary";
import { colorFromString } from "@/lib/colorFromString";

const fetcher = (url: string) =>
  fetch(url).then(async (r) => {
    if (!r.ok) throw new Error((await r.json()).error ?? r.statusText);
    return r.json();
  });

export default function AdminPage() {
  const { data: status, mutate: refreshStatus } = useSWR<{ unlocked: boolean }>(
    "/api/auth/status",
    fetcher
  );

  if (!status) return <Frame>loading…</Frame>;
  if (!status.unlocked) return <LoginGate onUnlock={() => refreshStatus()} />;
  return <AdminConsole onLogout={() => refreshStatus()} />;
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Head>
        <title>Study · Admin</title>
      </Head>
      <main className="min-h-screen bg-[#1a120b] text-[#e8d9b8] font-mono">
        <div className="mx-auto max-w-4xl p-6 md:p-10">{children}</div>
      </main>
    </>
  );
}

function LoginGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Login failed");
        return;
      }
      onUnlock();
    } catch {
      setError("Network error — is the server up?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Frame>
      <h1 className="text-2xl tracking-widest uppercase mb-6">The Study</h1>
      <form onSubmit={submit} className="space-y-3 max-w-sm">
        <label className="block text-xs uppercase tracking-widest opacity-70">
          Passphrase
        </label>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-[#2a1d12] border border-[#5b3a29] px-3 py-2 outline-none focus:border-[#c9a36a]"
        />
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 bg-[#5b3a29] hover:bg-[#7a4b2a] border border-[#c9a36a] tracking-widest uppercase text-xs disabled:opacity-50"
        >
          {busy ? "…" : "Unlock"}
        </button>
        {error && <p className="text-[#e8a47b] text-sm">{error}</p>}
      </form>
    </Frame>
  );
}

function AdminConsole({ onLogout }: { onLogout: () => void }) {
  // ?admin=1 bypasses the CDN cache so edits show up immediately after save.
  const { data: books, mutate: refetchBooks } = useSWR<Book[]>(
    "/api/books?admin=1",
    fetcher
  );
  const { data: shelves, mutate: refetchShelves } = useSWR<Shelf[]>(
    "/api/shelves?admin=1",
    fetcher
  );

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    onLogout();
  }

  return (
    <Frame>
      <header className="flex items-baseline justify-between mb-8">
        <h1 className="text-2xl tracking-widest uppercase">The Study · Admin</h1>
        <div className="flex gap-4 text-xs">
          <a href="/study" className="underline opacity-70 hover:opacity-100">
            view room →
          </a>
          <button onClick={logout} className="opacity-70 hover:opacity-100">
            lock
          </button>
        </div>
      </header>

      <Section title="Add a book">
        <AddBook
          shelves={shelves ?? []}
          onAdded={() => refetchBooks()}
        />
      </Section>

      <Section title="Shelves">
        <ShelfManager shelves={shelves ?? []} onChange={() => refetchShelves()} />
      </Section>

      <Section title={`Library (${books?.length ?? 0})`}>
        <BookList
          books={books ?? []}
          shelves={shelves ?? []}
          onChange={() => refetchBooks()}
        />
      </Section>
    </Frame>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="text-xs uppercase tracking-widest opacity-70 mb-3 border-b border-[#5b3a29] pb-1">
        {title}
      </h2>
      {children}
    </section>
  );
}

function AddBook({
  shelves,
  onAdded,
}: {
  shelves: Shelf[];
  onAdded: () => void;
}) {
  const [mode, setMode] = useState<"isbn" | "title" | "manual">("isbn");
  const [isbn, setIsbn] = useState("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [preview, setPreview] = useState<LookupResult | null>(null);
  const [shelfId, setShelfId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup() {
    setBusy(true);
    setError(null);
    setPreview(null);
    const params = new URLSearchParams();
    if (mode === "isbn") params.set("isbn", isbn);
    else if (mode === "title") {
      params.set("title", title);
      if (author) params.set("author", author);
    }
    try {
      const res = await fetch(`/api/lookup?${params}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Not found");
      }
      setPreview(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!preview) return;
    setBusy(true);
    setError(null);
    const spineColor = colorFromString(
      preview.title + (preview.authors[0] ?? "")
    );
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...preview,
          shelfId,
          spineColor,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Save failed");
      }
      setPreview(null);
      setIsbn("");
      setTitle("");
      setAuthor("");
      onAdded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveManual(b: ManualBook) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...b,
          shelfId,
          spineColor: colorFromString(b.title + (b.authors[0] ?? "")),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Save failed");
      }
      onAdded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex gap-3 mb-3 text-xs uppercase tracking-widest">
        {(["isbn", "title", "manual"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setPreview(null);
              setError(null);
            }}
            className={
              mode === m
                ? "underline opacity-100"
                : "opacity-50 hover:opacity-100"
            }
          >
            {m}
          </button>
        ))}
      </div>

      {mode !== "manual" && (
        <div className="space-y-2">
          {mode === "isbn" ? (
            <input
              placeholder="ISBN-10 or ISBN-13"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              className="w-full md:w-96 bg-[#2a1d12] border border-[#5b3a29] px-3 py-2 outline-none focus:border-[#c9a36a]"
            />
          ) : (
            <div className="flex flex-col md:flex-row gap-2">
              <input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full md:w-72 bg-[#2a1d12] border border-[#5b3a29] px-3 py-2 outline-none focus:border-[#c9a36a]"
              />
              <input
                placeholder="Author (optional)"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full md:w-64 bg-[#2a1d12] border border-[#5b3a29] px-3 py-2 outline-none focus:border-[#c9a36a]"
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={lookup}
              disabled={busy || (mode === "isbn" ? !isbn : !title)}
              className="px-3 py-1 border border-[#c9a36a] text-xs uppercase tracking-widest hover:bg-[#5b3a29] disabled:opacity-40"
            >
              {busy ? "…" : "look up"}
            </button>
            <ShelfPicker shelves={shelves} value={shelfId} onChange={setShelfId} />
          </div>
          {error && <p className="text-[#e8a47b] text-sm">{error}</p>}

          {preview && (
            <div className="mt-4 border border-[#5b3a29] p-4 flex gap-4 bg-[#2a1d12]">
              {preview.coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview.coverUrl}
                  alt=""
                  className="w-24 h-auto object-cover"
                />
              )}
              <div className="flex-1">
                <div className="font-semibold">{preview.title}</div>
                {preview.subtitle && (
                  <div className="text-sm opacity-70">{preview.subtitle}</div>
                )}
                <div className="text-sm">
                  {preview.authors.join(", ")}
                  {preview.publishedYear ? ` · ${preview.publishedYear}` : ""}
                </div>
                {preview.publisher && (
                  <div className="text-xs opacity-60">{preview.publisher}</div>
                )}
                <div className="text-xs opacity-50 mt-2">
                  source: {preview.source}
                  {preview.isbn13 ? ` · isbn ${preview.isbn13}` : ""}
                  {preview.pageCount ? ` · ${preview.pageCount}pp` : ""}
                </div>
              </div>
              <button
                onClick={save}
                disabled={busy}
                className="self-start px-3 py-1 border border-[#c9a36a] text-xs uppercase tracking-widest hover:bg-[#5b3a29] disabled:opacity-40"
              >
                {busy ? "…" : "shelve"}
              </button>
            </div>
          )}
        </div>
      )}

      {mode === "manual" && (
        <ManualEntry shelves={shelves} onSubmit={saveManual} busy={busy} />
      )}
    </div>
  );
}

type ManualBook = {
  title: string;
  authors: string[];
  publishedYear?: number | null;
  publisher?: string | null;
  description?: string | null;
};

function ManualEntry({
  onSubmit,
  busy,
}: {
  shelves: Shelf[];
  onSubmit: (b: ManualBook) => void;
  busy: boolean;
}) {
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [year, setYear] = useState("");
  const [publisher, setPublisher] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          title,
          authors: authors.split(",").map((s) => s.trim()).filter(Boolean),
          publishedYear: year ? Number(year) : null,
          publisher: publisher || null,
        });
        setTitle("");
        setAuthors("");
        setYear("");
        setPublisher("");
      }}
      className="space-y-2"
    >
      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="w-full md:w-96 bg-[#2a1d12] border border-[#5b3a29] px-3 py-2 outline-none focus:border-[#c9a36a]"
      />
      <input
        placeholder="Authors (comma-separated)"
        value={authors}
        onChange={(e) => setAuthors(e.target.value)}
        className="w-full md:w-96 bg-[#2a1d12] border border-[#5b3a29] px-3 py-2 outline-none focus:border-[#c9a36a]"
      />
      <div className="flex gap-2">
        <input
          placeholder="Year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="w-32 bg-[#2a1d12] border border-[#5b3a29] px-3 py-2 outline-none focus:border-[#c9a36a]"
        />
        <input
          placeholder="Publisher"
          value={publisher}
          onChange={(e) => setPublisher(e.target.value)}
          className="w-full md:w-64 bg-[#2a1d12] border border-[#5b3a29] px-3 py-2 outline-none focus:border-[#c9a36a]"
        />
      </div>
      <button
        type="submit"
        disabled={busy || !title}
        className="px-3 py-1 border border-[#c9a36a] text-xs uppercase tracking-widest hover:bg-[#5b3a29] disabled:opacity-40"
      >
        shelve
      </button>
    </form>
  );
}

function ShelfPicker({
  shelves,
  value,
  onChange,
}: {
  shelves: Shelf[];
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      className="bg-[#2a1d12] border border-[#5b3a29] px-2 py-1 text-xs"
    >
      <option value="">— no shelf —</option>
      {shelves.map((s) => (
        <option key={s.id} value={s.id}>
          {s.label}
        </option>
      ))}
    </select>
  );
}

function ShelfManager({
  shelves,
  onChange,
}: {
  shelves: Shelf[];
  onChange: () => void;
}) {
  const [label, setLabel] = useState("");
  async function add() {
    if (!label) return;
    await fetch("/api/shelves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, sortOrder: shelves.length }),
    });
    setLabel("");
    onChange();
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {shelves.map((s) => (
          <span
            key={s.id}
            className="px-2 py-1 border border-[#5b3a29] text-xs"
          >
            {s.label}
          </span>
        ))}
        {shelves.length === 0 && (
          <span className="opacity-50 text-xs">no shelves yet</span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          placeholder="New shelf label (e.g. Philosophy)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="bg-[#2a1d12] border border-[#5b3a29] px-3 py-2 outline-none focus:border-[#c9a36a]"
        />
        <button
          onClick={add}
          disabled={!label}
          className="px-3 py-1 border border-[#c9a36a] text-xs uppercase tracking-widest hover:bg-[#5b3a29] disabled:opacity-40"
        >
          add shelf
        </button>
      </div>
    </div>
  );
}

function BookList({
  books,
  shelves,
  onChange,
}: {
  books: Book[];
  shelves: Shelf[];
  onChange: () => void;
}) {
  const [filter, setFilter] = useState<number | null | "all">("all");
  const filtered = useMemo(() => {
    if (filter === "all") return books;
    return books.filter((b) => b.shelfId === filter);
  }, [books, filter]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3 text-xs">
        <button
          onClick={() => setFilter("all")}
          className={
            filter === "all"
              ? "underline opacity-100"
              : "opacity-60 hover:opacity-100"
          }
        >
          all
        </button>
        <button
          onClick={() => setFilter(null)}
          className={
            filter === null
              ? "underline opacity-100"
              : "opacity-60 hover:opacity-100"
          }
        >
          unshelved
        </button>
        {shelves.map((s) => (
          <button
            key={s.id}
            onClick={() => setFilter(s.id)}
            className={
              filter === s.id
                ? "underline opacity-100"
                : "opacity-60 hover:opacity-100"
            }
          >
            {s.label}
          </button>
        ))}
      </div>

      <ul className="divide-y divide-[#5b3a29]">
        {filtered.map((b) => (
          <BookRow key={b.id} book={b} shelves={shelves} onChange={onChange} />
        ))}
        {filtered.length === 0 && (
          <li className="py-4 opacity-50 text-sm">No books here yet.</li>
        )}
      </ul>
    </div>
  );
}

function BookRow({
  book,
  shelves,
  onChange,
}: {
  book: Book;
  shelves: Shelf[];
  onChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(book);
  const [busy, setBusy] = useState(false);
  useEffect(() => setDraft(book), [book]);

  async function save() {
    setBusy(true);
    const payload = {
      title: draft.title,
      authors: draft.authors,
      rating: draft.rating,
      notes: draft.notes,
      status: draft.status,
      shelfId: draft.shelfId,
      slotIndex: draft.slotIndex,
      spineColor: draft.spineColor,
      dateStarted: draft.dateStarted ? new Date(draft.dateStarted).toISOString() : null,
      dateFinished: draft.dateFinished ? new Date(draft.dateFinished).toISOString() : null,
    };
    const res = await fetch(`/api/books/${book.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (res.ok) {
      onChange();
      setOpen(false);
    }
  }

  async function remove() {
    if (!confirm(`Remove "${book.title}"?`)) return;
    await fetch(`/api/books/${book.id}`, { method: "DELETE" });
    onChange();
  }

  return (
    <li className="py-3">
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => setOpen((o) => !o)}
      >
        <div
          className="w-6 h-9 flex-shrink-0"
          style={{ background: book.spineColor ?? "#5b3a29" }}
        />
        <div className="flex-1 min-w-0">
          <div className="truncate">{book.title}</div>
          <div className="text-xs opacity-60 truncate">
            {book.authors.join(", ")}
            {book.publishedYear ? ` · ${book.publishedYear}` : ""}
            {book.rating ? ` · ${book.rating}/10` : ""}
            {book.shelfId
              ? ` · ${shelves.find((s) => s.id === book.shelfId)?.label ?? "?"}`
              : ""}
          </div>
        </div>
        <span className="text-xs opacity-50">{open ? "▾" : "▸"}</span>
      </div>

      {open && (
        <div className="mt-3 ml-9 space-y-2 text-sm">
          <Field label="Title">
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="w-full bg-[#2a1d12] border border-[#5b3a29] px-2 py-1"
            />
          </Field>
          <Field label="Authors (comma-separated)">
            <input
              value={draft.authors.join(", ")}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  authors: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              className="w-full bg-[#2a1d12] border border-[#5b3a29] px-2 py-1"
            />
          </Field>
          <div className="flex flex-wrap gap-3">
            <Field label="Rating (1-10)">
              <input
                type="number"
                min={1}
                max={10}
                value={draft.rating ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    rating: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="w-20 bg-[#2a1d12] border border-[#5b3a29] px-2 py-1"
              />
            </Field>
            <Field label="Status">
              <select
                value={draft.status}
                onChange={(e) =>
                  setDraft({ ...draft, status: e.target.value as Book["status"] })
                }
                className="bg-[#2a1d12] border border-[#5b3a29] px-2 py-1"
              >
                <option value="want_to_read">want to read</option>
                <option value="reading">reading</option>
                <option value="finished">finished</option>
                <option value="abandoned">abandoned</option>
              </select>
            </Field>
            <Field label="Shelf">
              <select
                value={draft.shelfId ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    shelfId: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="bg-[#2a1d12] border border-[#5b3a29] px-2 py-1"
              >
                <option value="">— none —</option>
                {shelves.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Slot">
              <input
                type="number"
                value={draft.slotIndex}
                onChange={(e) =>
                  setDraft({ ...draft, slotIndex: Number(e.target.value) })
                }
                className="w-20 bg-[#2a1d12] border border-[#5b3a29] px-2 py-1"
              />
            </Field>
            <Field label="Spine">
              <input
                type="color"
                value={draft.spineColor ?? "#5b3a29"}
                onChange={(e) =>
                  setDraft({ ...draft, spineColor: e.target.value })
                }
                className="w-10 h-8 bg-transparent border border-[#5b3a29]"
              />
            </Field>
          </div>
          <Field label="Notes">
            <textarea
              rows={5}
              value={draft.notes ?? ""}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              className="w-full bg-[#2a1d12] border border-[#5b3a29] px-2 py-1 font-mono"
            />
          </Field>
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={busy}
              className="px-3 py-1 border border-[#c9a36a] text-xs uppercase tracking-widest hover:bg-[#5b3a29] disabled:opacity-40"
            >
              {busy ? "…" : "save"}
            </button>
            <button
              onClick={remove}
              className="px-3 py-1 border border-[#8a3324] text-xs uppercase tracking-widest hover:bg-[#8a3324]"
            >
              delete
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-widest opacity-60 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
