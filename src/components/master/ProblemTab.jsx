import { useEffect, useState } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import ProblemModal from "../modal/ProblemModal";
import DeleteConfirmModal from "../modal/DeleteConfirmModal";
import { getProblems, createProblem, updateProblem, deleteProblem } from "../../services/problemService";
import { getAllParts } from "../../services/partService";

export default function ProblemTab() {
  const [data, setData] = useState([]);
  const [parts, setParts] = useState([]);
  const [selectedData, setSelectedData] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [partsLoading, setPartsLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await getProblems(page, search);

      setData(Array.isArray(res.data) ? res.data : []);

      setTotalPage(
        Math.max(Number(res.total_page) || 1, 1),
      );
    } catch (error) {
      console.error("Failed to fetch problems:", error);
      alert(
        error.message || "Gagal mengambil data permasalahan",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchParts = async () => {
    try {
      setPartsLoading(true);

      const result = await getAllParts();

      setParts(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("Failed to fetch all parts:", error);
      alert(error.message || "Gagal mengambil seluruh data Part");
    } finally {
      setPartsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, search]);

  useEffect(() => {
    fetchParts();
  }, []);

  const handleSubmit = async (name, partId) => {
    try {
      const payload = {
        name,
        part_id: Number(partId),
      };

      if (selectedData) {
        await updateProblem(selectedData.id, payload);
      } else {
        await createProblem(payload);
      }

      setIsModalOpen(false);
      setSelectedData(null);

      await fetchData();
    } catch (error) {
      console.error("Failed to save problem:", error);

      alert(
        error.message || "Gagal menyimpan permasalahan",
      );
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProblem(deleteId);

      setDeleteId(null);

      await fetchData();
    } catch (error) {
      console.error("Failed to delete problem:", error);

      alert(
        error.message || "Gagal menghapus permasalahan",
      );
    }
  };

  return (
    <>
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          Data Permasalahan
        </h2>

        <button
          type="button"
          onClick={() => {
            setSelectedData(null);
            setIsModalOpen(true);
          }}
          className="whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          + Permasalahan
        </button>
      </div>

      {/* SEARCH */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Cari permasalahan..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 md:w-1/2 lg:w-1/3"
        />
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-8 text-center text-gray-500">
            Memuat data permasalahan...
          </div>
        ) : data.length === 0 ? (
          <div className="py-8 text-center text-gray-400">
            Belum ada data permasalahan.
          </div>
        ) : (
          data.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-gray-50"
            >
              <div className="min-w-0">
                <p className="break-words font-medium text-gray-900">
                  {item.name}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Part: {item.part?.name || "Belum terhubung"}
                </p>

                {item.part?.project?.name && (
                  <p className="text-xs text-gray-400">
                    Project: {item.part.project.name}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedData(item);
                    setIsModalOpen(true);
                  }}
                  className="text-orange-600 hover:text-orange-800"
                  title="Edit"
                >
                  <FiEdit2 size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteId(item.id)}
                  className="text-red-500 hover:text-red-700"
                  title="Hapus"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PAGINATION */}
      {!loading && data.length > 0 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
            className="rounded border px-3 py-1 disabled:opacity-50"
          >
            Prev
          </button>

          <span className="px-3 py-1">
            Page {page} of {totalPage}
          </span>

          <button
            type="button"
            disabled={page === totalPage}
            onClick={() => setPage((prev) => prev + 1)}
            className="rounded border px-3 py-1 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* MODAL */}
      <ProblemModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedData(null);
        }}
        onSubmit={handleSubmit}
        initialData={selectedData}
        parts={parts}
        partsLoading={partsLoading}
      />

      {/* DELETE CONFIRM */}
      <DeleteConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}