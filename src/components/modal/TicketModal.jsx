import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import Select from "react-select";
import {
    createTicket,
    getProjects,
    getLocations,
    getParts,
    getAssets,
    getStaffs,
  } from "../../services/ticketService";

export default function TicketModal({ onClose, onSuccess, user }) {

  const [loading, setLoading] = useState(false);

  const [projects, setProjects] = useState([]);
  const [locations, setLocations] = useState([]);
  const [parts, setParts] = useState([]);
  const [assets, setAssets] = useState([]);
  const [staffs, setStaffs] = useState([]);

  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const [preview, setPreview] = useState(null);
  const [attachment, setAttachment] = useState(null);

  const token = localStorage.getItem("token");
  let currentUser = null;

  if (token) {
    currentUser = jwtDecode(token);
  }

  const projectOptions = projects.map(p => ({
    value: p.id,
    label: p.name
  }));
  
  const locationOptions = locations.map(l => ({
    value: l.id,
    label: l.name
  }));
  
  const partOptions = parts.map(p => ({
    value: p.id,
    label: p.name
  }));
  
  const assetOptions = assets.map(a => ({
    value: a.id,
    label: a.name
  }));

  const priorityOptions = [
    { value: "URGENT", label: "URGENT (15 menit)" },
    { value: "HIGH", label: "HIGH (1 jam)" },
    { value: "MEDIUM", label: "MEDIUM (2 jam)" },
    { value: "LOW", label: "LOW (4 jam)" },
  ];

  const [form, setForm] = useState({
    project_id: "",
    location_id: "",
    part_id: "",
    asset_id: "",
    assigned_to_id: "",
    priority: "URGENT",
    description: "",
  });

  useEffect(() => {
    fetchProjects();
    fetchStaffs();
  }, []);
  
  const fetchProjects = async () => {
    const res = await getProjects();
    setProjects(res.data || []);
  };
  
  const fetchStaffs = async () => {
    const res = await getStaffs();
    
    const activeStaffs = (res.data || []).filter(
      (user) => user.is_active === true
    );  
    setStaffs(activeStaffs);
  };

  const handleProjectChange = async (e) => {
    const projectId = e.target.value;
  
    setForm({
      ...form,
      project_id: projectId,
      location_id: "",
      part_id: "",
      asset_id: "",
    });
  
    const [locRes, partRes] = await Promise.all([
      getLocations(projectId),
      getParts(projectId),
    ]);
  
    setLocations(locRes.data || []);
    setParts(partRes.data || []);
    setAssets([]);
  };
  
  const handleLocationChange = async (e) => {
    const locationId = e.target.value;
  
    setForm({
      ...form,
      location_id: locationId,
    });
  };
  
  const handlePartChange = async (e) => {
    const partId = e.target.value;
  
    setForm({ ...form, part_id: partId, asset_id: "" });
  
    const res = await getAssets(partId);
    setAssets(res.data || []);
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
  
    setAttachment(file);
  
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
  
      const formData = new FormData();
  
      Object.keys(form).forEach((key) => {
        formData.append(key, form[key]);
      });
  
      if (attachment) {
        formData.append("attachment", attachment);
      }
  
      const res = await createTicket(formData);
  
      alert(res.message);
      onSuccess();
      onClose();
  
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white w-full max-w-6xl rounded-xl shadow-lg p-6 overflow-y-auto max-h-[90vh]">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Buat Tiket Baru</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* LEFT */}
          <div className="border rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3 text-gray-600">
              INFORMASI PERMASALAHAN
            </h3>

            <div className="space-y-3">

              <Select
                options={projectOptions}
                value={selectedProject}
                onChange={async (selected) => {
                  setSelectedProject(selected);

                  setSelectedLocation(null);
                  setSelectedPart(null);
                  setSelectedAsset(null);

                  setForm({
                    ...form,
                    project_id: selected?.value || "",
                    location_id: "",
                    part_id: "",
                    asset_id: "",
                  });

                  const [locRes, partRes] = await Promise.all([
                    getLocations(selected.value),
                    getParts(selected.value),
                  ]);

                  setLocations(locRes.data || []);
                  setParts(partRes.data || []);
                  setAssets([]);
                }}
                placeholder="Pilih atau ketik project..."
                isSearchable
              />

              <div className="grid grid-cols-2 gap-2">
                <Select
                  options={locationOptions}
                  value={selectedLocation}
                  onChange={(selected) => {
                    setSelectedLocation(selected);

                    setSelectedPart(null);
                    setSelectedAsset(null);

                    setForm({
                      ...form,
                      location_id: selected?.value || "",
                      part_id: "",
                      asset_id: "",
                    });
                  }}
                  placeholder="Pilih atau ketik lokasi..."
                  isSearchable
                  isDisabled={!selectedProject}
                />

                <Select
                  options={partOptions}
                  value={selectedPart}
                  onChange={async (selected) => {
                    setSelectedPart(selected);

                    setSelectedAsset(null);

                    setForm({
                      ...form,
                      part_id: selected?.value || "",
                      asset_id: "",
                    });

                    const res = await getAssets(selected.value);
                    setAssets(res.data || []);
                  }}
                  placeholder="Pilih atau ketik part..."
                  isSearchable
                  isDisabled={!selectedProject}
                />
              </div>

              <Select
                options={assetOptions}
                value={selectedAsset}
                onChange={(selected) => {
                  setSelectedAsset(selected);

                  setForm({
                    ...form,
                    asset_id: selected?.value || "",
                  });
                }}
                placeholder="Pilih atau ketik part id..."
                isSearchable
                isDisabled={!selectedPart}
              />

              <textarea
                name="description"
                placeholder="Deskripsi Masalah"
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-lg"
              />

              {/* FILE UPLOAD */}
              <input type="file" onChange={handleFileChange} />

              {preview && (
                <img
                    src={preview}
                    alt="preview"
                    className="mt-2 w-32 h-32 object-cover rounded-lg border"
                />
              )}

            </div>
          </div>

          {/* RIGHT */}
          <div className="border rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3 text-gray-600">
              ASSIGN TO USER
            </h3>

            <div className="space-y-3">

              {/* PELAPOR */}
              <input
                value={currentUser?.name || "-"}
                disabled
                className="w-full border px-3 py-2 rounded-lg bg-gray-100"
              />

              {/* STATUS */}
              <input
                value="OPEN"
                disabled
                className="w-full border px-3 py-2 rounded-lg bg-gray-100"
              />

              {/* PRIORITY */}
              <Select
                options={priorityOptions}
                value={priorityOptions.find(p => p.value === form.priority)}
                onChange={(selected) => {
                  setForm({
                    ...form,
                    priority: selected.value,
                  });
                }}
                placeholder="Pilih priority..."
              />

              {/* ASSIGNED */}
              <select
                name="assigned_to_id"
                value={form.assigned_to_id}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-lg"
              >
                <option value="">Pilih Staff</option>
                {staffs.length > 0 ? (
                  staffs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))
                ) : (
                  <option disabled>Tidak ada staff aktif</option>
                )}
              </select>

            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">
            Batal
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            {loading ? "Menyimpan..." : "Buat Tiket"}
          </button>
        </div>

      </div>
    </div>
  );
}