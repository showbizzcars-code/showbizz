import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  adminListVehicles,
  adminSaveVehicle,
  adminDeleteVehicle,
  adminGetVehicle,
  adminUploadVehicleImage,
  adminDeleteVehicleImage,
  adminReorderVehicleImages,
  adminListEnquiries,
  adminUpdateEnquiryStatus,
  adminListPosts,
  adminSavePost,
  adminDeletePost,
  adminListFaqs,
  adminSaveFaq,
  adminDeleteFaq,
  adminListTestimonials,
  adminSaveTestimonial,
  adminDeleteTestimonial,
  adminGetSettings,
  adminSaveSettings,
} from "@/lib/showbizz/admin";
import { getAdminOverview, type AdminOverview } from "@/lib/showbizz/content";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

type Tab = "overview" | "vehicles" | "enquiries" | "posts" | "faqs" | "testimonials" | "settings";

function AdminDashboard() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminOverview()
      .then(setOverview)
      .catch((err) => setError(err instanceof Error ? err.message : "Error loading dashboard."));
  }, []);

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-10">
        <p role="alert" className="text-sm text-danger">{error}</p>
      </main>
    );
  }

  if (!overview) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-10">
        <div className="h-40 animate-pulse rounded-card bg-line" />
      </main>
    );
  }

  if (!overview.role) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-10">
        <section className="rounded-card border border-line bg-surface p-6">
          <h1 className="font-display text-3xl">No staff role</h1>
          <p className="mt-3 text-sm text-muted">
            This account is signed in, but it is not on the staff list. An admin operator with database access must grant you a role.
          </p>
          <p className="mt-4 text-xs font-mono uppercase text-muted">User ID</p>
          <p className="mt-1 break-all font-mono text-sm">{overview.userId}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap gap-2 border-b border-line pb-4 mb-8">
        {(["overview", "vehicles", "enquiries", "posts", "faqs", "testimonials", "settings"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-control text-sm font-medium capitalize transition ${
              activeTab === tab ? "bg-accent text-accent-fg" : "border border-line bg-surface text-ink hover:bg-line/30"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "overview" && <OverviewTab overview={overview} />}
      {activeTab === "vehicles" && <VehiclesTab />}
      {activeTab === "enquiries" && <EnquiriesTab />}
      {activeTab === "posts" && <PostsTab />}
      {activeTab === "faqs" && <FaqsTab />}
      {activeTab === "testimonials" && <TestimonialsTab />}
      {activeTab === "settings" && <SettingsTab role={overview.role} />}
    </main>
  );
}

// --- OVERVIEW TAB ---
function OverviewTab({ overview }: { overview: AdminOverview }) {
  return (
    <section>
      <h1 className="font-display text-3xl">Staff Desk Overview</h1>
      <p className="mt-2 text-sm text-muted">Signed in as <span className="font-semibold uppercase">{overview.role}</span>.</p>
      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Vehicles", `${overview.counts?.publishedVehicles ?? 0} published / ${overview.counts?.vehicles ?? 0} total`],
          ["New Enquiries", String(overview.counts?.newEnquiries ?? 0)],
          ["Blog Posts", String(overview.counts?.posts ?? 0)],
          ["FAQs", String(overview.counts?.faqs ?? 0)],
          ["Testimonials", String(overview.counts?.testimonials ?? 0)],
        ].map(([label, val]) => (
          <div key={label} className="rounded-card border border-line bg-surface p-4">
            <dt className="text-xs font-medium text-muted uppercase">{label}</dt>
            <dd className="mt-2 text-2xl font-bold tabular-nums">{val}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// --- VEHICLES TAB ---
function VehiclesTab() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const data = await adminListVehicles();
      setVehicles(data);
    } catch (e: any) {
      setMsg(e.message || "Failed to load vehicles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const openEdit = async (id?: string) => {
    setEditingId(id || "new");
    if (id) {
      const res = await adminGetVehicle({ data: id });
      setSelectedVehicle(res);
    } else {
      setSelectedVehicle({
        vehicle: {
          slug: "",
          title: "",
          summary: "",
          description: "",
          category: "",
          seats: "",
          model_year: "",
          transmission: "",
          fuel: "",
          daily_rate_minor: "",
          currency_code: "",
          availability: "unavailable",
          availability_note: "",
          status: "draft",
        },
        images: [],
      });
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const form = new FormData(e.currentTarget);
    const data: any = { id: selectedVehicle.vehicle.id };
    form.forEach((value, key) => (data[key] = value));

    try {
      await adminSaveVehicle({ data });
      setMsg("Vehicle saved successfully!");
      setEditingId(null);
      loadVehicles();
    } catch (err: any) {
      setMsg(err.message || "Failed to save vehicle.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vehicle listing?")) return;
    try {
      await adminDeleteVehicle({ data: id });
      loadVehicles();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleMoveImg = async (index: number, direction: "up" | "down") => {
    if (!selectedVehicle?.images || !selectedVehicle?.vehicle?.id) return;
    const images = [...selectedVehicle.images];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const temp = images[index];
    images[index] = images[targetIndex];
    images[targetIndex] = temp;

    const imageIds = images.map((img: any) => img.id);
    try {
      await adminReorderVehicleImages({
        data: {
          vehicleId: selectedVehicle.vehicle.id,
          imageIds,
        },
      });
      const res = await adminGetVehicle({ data: selectedVehicle.vehicle.id });
      setSelectedVehicle(res);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedVehicle?.vehicle?.id) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      try {
        await adminUploadVehicleImage({
          data: {
            vehicleId: selectedVehicle.vehicle.id,
            fileName: file.name,
            contentType: file.type,
            base64Data: base64,
            alt: selectedVehicle.vehicle.title,
          },
        });
        const res = await adminGetVehicle({ data: selectedVehicle.vehicle.id });
        setSelectedVehicle(res);
      } catch (err: any) {
        alert(err.message);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteImg = async (imgId: string) => {
    try {
      await adminDeleteVehicleImage({ data: imgId });
      const res = await adminGetVehicle({ data: selectedVehicle.vehicle.id });
      setSelectedVehicle(res);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (editingId && selectedVehicle) {
    const v = selectedVehicle.vehicle;
    return (
      <section className="bg-surface p-6 rounded-card border border-line">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{v.id ? "Edit Vehicle" : "New Vehicle"}</h2>
          <button onClick={() => setEditingId(null)} className="text-sm underline">Cancel</button>
        </div>
        {msg && <p className="mb-4 text-sm text-accent font-medium">{msg}</p>}

        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase text-muted font-medium mb-1">Title</label>
            <input name="title" defaultValue={v.title} required className="w-full rounded-control border border-line bg-bg p-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs uppercase text-muted font-medium mb-1">Slug</label>
            <input name="slug" defaultValue={v.slug} required placeholder="e.g. mercedes-s-class" className="w-full rounded-control border border-line bg-bg p-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs uppercase text-muted font-medium mb-1">Category</label>
            <input name="category" defaultValue={v.category || ""} className="w-full rounded-control border border-line bg-bg p-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs uppercase text-muted font-medium mb-1">Status</label>
            <select name="status" defaultValue={v.status} className="w-full rounded-control border border-line bg-bg p-2 text-sm">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase text-muted font-medium mb-1">Availability</label>
            <select name="availability" defaultValue={v.availability} className="w-full rounded-control border border-line bg-bg p-2 text-sm">
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
              <option value="on_request">On Request</option>
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase text-muted font-medium mb-1">Daily Rate (in cents/minor, e.g. 15000 = $150.00)</label>
            <input name="dailyRateMinor" type="number" defaultValue={v.daily_rate_minor ?? ""} className="w-full rounded-control border border-line bg-bg p-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs uppercase text-muted font-medium mb-1">Currency Code</label>
            <input name="currencyCode" defaultValue={v.currency_code || ""} placeholder="e.g. USD" className="w-full rounded-control border border-line bg-bg p-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs uppercase text-muted font-medium mb-1">Transmission</label>
            <select name="transmission" defaultValue={v.transmission || ""} className="w-full rounded-control border border-line bg-bg p-2 text-sm">
              <option value="">Unspecified</option>
              <option value="automatic">Automatic</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase text-muted font-medium mb-1">Seats</label>
            <input name="seats" type="number" defaultValue={v.seats ?? ""} className="w-full rounded-control border border-line bg-bg p-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs uppercase text-muted font-medium mb-1">Model Year</label>
            <input name="modelYear" type="number" defaultValue={v.model_year ?? ""} className="w-full rounded-control border border-line bg-bg p-2 text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs uppercase text-muted font-medium mb-1">Summary</label>
            <input name="summary" defaultValue={v.summary} className="w-full rounded-control border border-line bg-bg p-2 text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs uppercase text-muted font-medium mb-1">Description</label>
            <textarea name="description" rows={4} defaultValue={v.description} className="w-full rounded-control border border-line bg-bg p-2 text-sm" />
          </div>
          <div className="md:col-span-2">
            <button type="submit" disabled={saving} className="bg-accent text-accent-fg px-5 py-2 rounded-control text-sm font-medium">
              {saving ? "Saving..." : "Save Vehicle"}
            </button>
          </div>
        </form>

        {v.id && (
          <div className="mt-8 border-t border-line pt-6">
            <h3 className="font-bold text-lg mb-4">Images</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {selectedVehicle.images.map((img: any, idx: number) => (
                <div key={img.id} className="border border-line rounded-card overflow-hidden bg-bg relative flex flex-col justify-between">
                  <img src={img.url || ""} alt={img.alt} className="w-full h-32 object-cover" />
                  <div className="p-2 flex justify-between items-center bg-surface border-t border-line text-xs">
                    <div className="space-x-1">
                      {idx > 0 && (
                        <button onClick={() => handleMoveImg(idx, "up")} className="underline">←</button>
                      )}
                      {idx < selectedVehicle.images.length - 1 && (
                        <button onClick={() => handleMoveImg(idx, "down")} className="underline">→</button>
                      )}
                    </div>
                    <button onClick={() => handleDeleteImg(img.id)} className="text-danger underline">Delete</button>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs uppercase text-muted font-medium mb-1">Upload New Image</label>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="text-sm" />
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Vehicle Fleet</h2>
        <button onClick={() => openEdit()} className="bg-accent text-accent-fg px-4 py-2 rounded-control text-sm font-medium">
          + Add Vehicle
        </button>
      </div>
      {loading ? (
        <div className="h-24 animate-pulse rounded-card bg-line" />
      ) : (
        <div className="border border-line rounded-card overflow-hidden bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="bg-bg text-muted border-b border-line text-xs uppercase">
              <tr>
                <th className="p-3">Title</th>
                <th className="p-3">Category</th>
                <th className="p-3">Status</th>
                <th className="p-3">Availability</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vh) => (
                <tr key={vh.id} className="border-b border-line last:border-0 hover:bg-bg/50">
                  <td className="p-3 font-medium">{vh.title}</td>
                  <td className="p-3">{vh.category || "—"}</td>
                  <td className="p-3"><span className="capitalize text-xs font-semibold">{vh.status}</span></td>
                  <td className="p-3"><span className="capitalize text-xs">{vh.availability}</span></td>
                  <td className="p-3 text-right space-x-2">
                    <button onClick={() => openEdit(vh.id)} className="text-accent underline text-xs">Edit</button>
                    <button onClick={() => handleDelete(vh.id)} className="text-danger underline text-xs">Delete</button>
                  </td>
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted">No vehicles found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// --- ENQUIRIES TAB ---
function EnquiriesTab() {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEnquiries = async () => {
    setLoading(true);
    try {
      const data = await adminListEnquiries();
      setEnquiries(data);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnquiries();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await adminUpdateEnquiryStatus({ data: { id, status } });
      loadEnquiries();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <section>
      <h2 className="text-xl font-bold mb-6">Booking Enquiries</h2>
      {loading ? (
        <div className="h-24 animate-pulse rounded-card bg-line" />
      ) : (
        <div className="border border-line rounded-card overflow-hidden bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="bg-bg text-muted border-b border-line text-xs uppercase">
              <tr>
                <th className="p-3">Contact</th>
                <th className="p-3">Vehicle</th>
                <th className="p-3">Message</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((eq) => (
                <tr key={eq.id} className="border-b border-line last:border-0 hover:bg-bg/50">
                  <td className="p-3">
                    <p className="font-medium">{eq.contact_name}</p>
                    <p className="text-xs text-muted">{eq.phone} | {eq.email || "No email"}</p>
                  </td>
                  <td className="p-3">{eq.vehicle_title || "General Enquiry"}</td>
                  <td className="p-3 max-w-xs truncate text-xs">{eq.message}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded font-semibold ${eq.status === 'new' ? 'bg-accent/20 text-accent' : 'bg-line text-ink'}`}>
                      {eq.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <select
                      value={eq.status}
                      onChange={(e) => handleStatusChange(eq.id, e.target.value)}
                      className="text-xs rounded-control border border-line bg-bg p-1"
                    >
                      <option value="new">New</option>
                      <option value="in_progress">In Progress</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                </tr>
              ))}
              {enquiries.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted">No booking enquiries received yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// --- POSTS TAB ---
function PostsTab() {
  const [posts, setPosts] = useState<any[]>([]);
  const [editingPost, setEditingPost] = useState<any | null>(null);

  const loadPosts = async () => {
    const data = await adminListPosts();
    setPosts(data);
  };

  useEffect(() => { loadPosts(); }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data: any = { id: editingPost?.id };
    form.forEach((value, key) => (data[key] = value));
    try {
      await adminSavePost({ data });
      setEditingPost(null);
      loadPosts();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete post?")) return;
    await adminDeletePost({ data: id });
    loadPosts();
  };

  if (editingPost !== null) {
    return (
      <section className="bg-surface p-6 rounded-card border border-line">
        <div className="flex justify-between mb-4"><h3 className="font-bold">Edit Blog Post</h3><button onClick={() => setEditingPost(null)} className="underline text-sm">Cancel</button></div>
        <form onSubmit={handleSave} className="space-y-4">
          <input name="title" defaultValue={editingPost.title || ""} placeholder="Post Title" required className="w-full rounded border border-line bg-bg p-2 text-sm" />
          <input name="slug" defaultValue={editingPost.slug || ""} placeholder="post-slug" required className="w-full rounded border border-line bg-bg p-2 text-sm" />
          <textarea name="excerpt" defaultValue={editingPost.excerpt || ""} placeholder="Excerpt" className="w-full rounded border border-line bg-bg p-2 text-sm" />
          <textarea name="bodyMarkdown" rows={8} defaultValue={editingPost.body_markdown || ""} placeholder="Body (Markdown)" className="w-full rounded border border-line bg-bg p-2 text-sm" />
          <select name="status" defaultValue={editingPost.status || "draft"} className="w-full rounded border border-line bg-bg p-2 text-sm">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <button type="submit" className="bg-accent text-accent-fg px-4 py-2 rounded text-sm">Save Post</button>
        </form>
      </section>
    );
  }

  return (
    <section>
      <div className="flex justify-between mb-4"><h2 className="text-xl font-bold">Blog Posts</h2><button onClick={() => setEditingPost({})} className="bg-accent text-accent-fg px-4 py-2 rounded text-sm">+ Add Post</button></div>
      <div className="border border-line rounded-card overflow-hidden bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-bg text-muted border-b border-line text-xs uppercase"><tr><th className="p-3">Title</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-b border-line">
                <td className="p-3 font-medium">{p.title}</td>
                <td className="p-3"><span className="capitalize text-xs">{p.status}</span></td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={() => setEditingPost(p)} className="text-accent underline text-xs">Edit</button>
                  <button onClick={() => handleDelete(p.id)} className="text-danger underline text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// --- FAQS TAB ---
function FaqsTab() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [editingFaq, setEditingFaq] = useState<any | null>(null);

  const loadFaqs = async () => { const data = await adminListFaqs(); setFaqs(data); };
  useEffect(() => { loadFaqs(); }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data: any = { id: editingFaq?.id };
    form.forEach((v, k) => (data[k] = v));
    try { await adminSaveFaq({ data }); setEditingFaq(null); loadFaqs(); } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => { if (confirm("Delete FAQ?")) { await adminDeleteFaq({ data: id }); loadFaqs(); } };

  if (editingFaq !== null) {
    return (
      <section className="bg-surface p-6 rounded-card border border-line">
        <div className="flex justify-between mb-4"><h3 className="font-bold">Edit FAQ</h3><button onClick={() => setEditingFaq(null)} className="underline text-sm">Cancel</button></div>
        <form onSubmit={handleSave} className="space-y-4">
          <input name="question" defaultValue={editingFaq.question || ""} placeholder="Question" required className="w-full rounded border border-line bg-bg p-2 text-sm" />
          <textarea name="answer" rows={4} defaultValue={editingFaq.answer || ""} placeholder="Answer" required className="w-full rounded border border-line bg-bg p-2 text-sm" />
          <select name="status" defaultValue={editingFaq.status || "draft"} className="w-full rounded border border-line bg-bg p-2 text-sm">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <button type="submit" className="bg-accent text-accent-fg px-4 py-2 rounded text-sm">Save FAQ</button>
        </form>
      </section>
    );
  }

  return (
    <section>
      <div className="flex justify-between mb-4"><h2 className="text-xl font-bold">FAQs</h2><button onClick={() => setEditingFaq({})} className="bg-accent text-accent-fg px-4 py-2 rounded text-sm">+ Add FAQ</button></div>
      <div className="border border-line rounded-card bg-surface overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-bg text-muted border-b border-line text-xs uppercase"><tr><th className="p-3">Question</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
          <tbody>
            {faqs.map((f) => (
              <tr key={f.id} className="border-b border-line">
                <td className="p-3 font-medium">{f.question}</td>
                <td className="p-3"><span className="capitalize text-xs">{f.status}</span></td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={() => setEditingFaq(f)} className="text-accent underline text-xs">Edit</button>
                  <button onClick={() => handleDelete(f.id)} className="text-danger underline text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// --- TESTIMONIALS TAB ---
function TestimonialsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const loadItems = async () => { const data = await adminListTestimonials(); setItems(data); };
  useEffect(() => { loadItems(); }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data: any = { id: editingItem?.id };
    form.forEach((v, k) => (data[k] = v));
    try { await adminSaveTestimonial({ data }); setEditingItem(null); loadItems(); } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => { if (confirm("Delete testimonial?")) { await adminDeleteTestimonial({ data: id }); loadItems(); } };

  if (editingItem !== null) {
    return (
      <section className="bg-surface p-6 rounded-card border border-line">
        <div className="flex justify-between mb-4"><h3 className="font-bold">Edit Testimonial</h3><button onClick={() => setEditingItem(null)} className="underline text-sm">Cancel</button></div>
        <form onSubmit={handleSave} className="space-y-4">
          <input name="authorName" defaultValue={editingItem.author_name || ""} placeholder="Author Name" required className="w-full rounded border border-line bg-bg p-2 text-sm" />
          <textarea name="quote" rows={3} defaultValue={editingItem.quote || ""} placeholder="Quote" required className="w-full rounded border border-line bg-bg p-2 text-sm" />
          <input name="attribution" defaultValue={editingItem.attribution || ""} placeholder="Attribution / Role (optional)" className="w-full rounded border border-line bg-bg p-2 text-sm" />
          <select name="status" defaultValue={editingItem.status || "draft"} className="w-full rounded border border-line bg-bg p-2 text-sm">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <button type="submit" className="bg-accent text-accent-fg px-4 py-2 rounded text-sm">Save Testimonial</button>
        </form>
      </section>
    );
  }

  return (
    <section>
      <div className="flex justify-between mb-4"><h2 className="text-xl font-bold">Testimonials</h2><button onClick={() => setEditingItem({})} className="bg-accent text-accent-fg px-4 py-2 rounded text-sm">+ Add Testimonial</button></div>
      <div className="border border-line rounded-card bg-surface overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-bg text-muted border-b border-line text-xs uppercase"><tr><th className="p-3">Author</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} className="border-b border-line">
                <td className="p-3 font-medium">{t.author_name}</td>
                <td className="p-3"><span className="capitalize text-xs">{t.status}</span></td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={() => setEditingItem(t)} className="text-accent underline text-xs">Edit</button>
                  <button onClick={() => handleDelete(t.id)} className="text-danger underline text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// --- SETTINGS TAB ---
function SettingsTab({ role }: { role: string }) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    adminGetSettings().then(setSettings).catch((err) => alert(err.message));
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const form = new FormData(e.currentTarget);
    const data: Record<string, string> = {};
    form.forEach((v, k) => (data[k] = String(v)));
    try {
      await adminSaveSettings({ data });
      setMsg("Settings saved successfully.");
    } catch (err: any) {
      setMsg(err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-surface p-6 rounded-card border border-line max-w-2xl">
      <h2 className="text-xl font-bold mb-4">Site Settings</h2>
      {msg && <p className="mb-4 text-sm text-accent font-medium">{msg}</p>}
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs uppercase text-muted font-medium mb-1">WhatsApp Business Number (E.164, e.g. +14155552671)</label>
          <input name="whatsapp_e164" defaultValue={settings.whatsapp_e164 || ""} className="w-full rounded border border-line bg-bg p-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs uppercase text-muted font-medium mb-1">Public Email</label>
          <input name="public_email" defaultValue={settings.public_email || ""} className="w-full rounded border border-line bg-bg p-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs uppercase text-muted font-medium mb-1">Public Phone</label>
          <input name="public_phone" defaultValue={settings.public_phone || ""} className="w-full rounded border border-line bg-bg p-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs uppercase text-muted font-medium mb-1">Address</label>
          <textarea name="address" rows={2} defaultValue={settings.address || ""} className="w-full rounded border border-line bg-bg p-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs uppercase text-muted font-medium mb-1">Instagram URL</label>
          <input name="instagram_url" defaultValue={settings.instagram_url || ""} className="w-full rounded border border-line bg-bg p-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs uppercase text-muted font-medium mb-1">Facebook URL</label>
          <input name="facebook_url" defaultValue={settings.facebook_url || ""} className="w-full rounded border border-line bg-bg p-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs uppercase text-muted font-medium mb-1">X / Twitter URL</label>
          <input name="x_url" defaultValue={settings.x_url || ""} className="w-full rounded border border-line bg-bg p-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs uppercase text-muted font-medium mb-1">YouTube URL</label>
          <input name="youtube_url" defaultValue={settings.youtube_url || ""} className="w-full rounded border border-line bg-bg p-2 text-sm" />
        </div>

        {role === "admin" ? (
          <button type="submit" disabled={saving} className="bg-accent text-accent-fg px-5 py-2 rounded text-sm font-medium">
            {saving ? "Saving..." : "Save Settings"}
          </button>
        ) : (
          <p className="text-xs text-muted">Admin role required to save settings.</p>
        )}
      </form>
    </section>
  );
}
