
import { useEffect, useState } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import ProblemModal from "../modal/ProblemModal";
import DeleteConfirmModal from "../modal/DeleteConfirmModal";

import {
  getProblems,
  createProblem,
  updateProblem,
  deleteProblem,
} from "../../services/problemService";

export default function ProblemTab() {
  const [data, setData] = useState([]);
  const [selectedData, setSelectedData] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await getProblems(page, search);

      setData(res.data || []);
      setTotalPage(
        Math.max(Number(res.total_page) || 1, 1),
      );
    } catch (error) {
      console.error("Failed to fetch problems:", error);
      alert(error.message || "Gagal mengambil data permasalahan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, search]);

  const handleSubmit = async (name) => {
    try {
      if (selectedData) {
        await updateProblem(selectedData.id, {
          name,
        });
      } else {
        await createProblem({
          name,
        });
      }

      setIsModalOpen(false);
      setSelectedData(null);

      await fetchData();
    } catch (error) {
      console.error("Failed to save problem:", error);
      alert(error.message || "Gagal menyimpan permasalahan");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProblem(deleteId);

      setDeleteId(null);

      await fetchData();
    } catch (error) {
      console.error("Failed to delete problem:", error);
      alert(error.message || "Gagal menghapus permasalahan");
    }
  };

  return (
    <>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 gap-3">
        <h2 className="text-lg font-semibold">
          Data Permasalahan
        </h2>

        <button
          onClick={() => {
            setSelectedData(null);
            setIsModalOpen(true);
          }}
          className="
            bg-blue-600 text-white
            px-4 py-2 rounded-lg
            hover:bg-blue-700
            whitespace-nowrap
          "
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
          className="
            w-full md:w-1/2 lg:w-1/3
            border px-3 py-2
            rounded-lg
            focus:outline-none
            focus:ring-2 focus:ring-blue-500
          "
        />
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            Memuat data permasalahan...
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            Belum ada data permasalahan.
          </div>
        ) : (
          data.map((item) => (
            <div
              key={item.id}
              className="
                flex justify-between items-center
                gap-3 p-3
                border rounded-lg
                hover:bg-gray-50
              "
            >
              <div className="min-w-0">
                <p className="font-medium text-gray-900 break-words">
                  {item.name}
                </p>
              </div>

              <div className="flex gap-4 items-center shrink-0">
                <button
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
        <div className="flex justify-center mt-6 gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="
              px-3 py-1 border rounded
              disabled:opacity-50
            "
          >
            Prev
          </button>

          <span className="px-3 py-1">
            Page {page} of {totalPage}
          </span>

          <button
            disabled={page === totalPage}
            onClick={() => setPage(page + 1)}
            className="
              px-3 py-1 border rounded
              disabled:opacity-50
            "
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
