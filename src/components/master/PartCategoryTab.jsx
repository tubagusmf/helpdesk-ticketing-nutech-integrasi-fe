import { useEffect, useState } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import PartCategoryModal from "../modal/PartCategoryModal";
import DeleteConfirmModal from "../modal/DeleteConfirmModal";
import { getPartCategories, createPartCategory, updatePartCategory, deletePartCategory } from "../../services/partCategoryService";
import { getParts } from "../../services/partService";

export default function PartCategoryTab() {
  const [data, setData] = useState([]);
  const [parts, setParts] = useState([]);
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

      const res = await getPartCategories(page, search);

      setData(res.data || []);
      setTotalPage(res.total_page || 1);
    } catch (error) {
      console.error("Gagal mengambil data kategori Part:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchParts = async () => {
    try {
      const res = await getParts(1, "", 1000);

      setParts(res.data || []);
    } catch (error) {
      console.error("Gagal mengambil data Part:", error);
      setParts([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, search]);

  useEffect(() => {
    fetchParts();
  }, []);

  const handleSubmit = async (name, partId) => {
    if (!name.trim() || !partId) return;

    try {
      const payload = {
        name: name.trim(),
        part_id: Number(partId),
      };

      if (selectedData) {
        await updatePartCategory(selectedData.id, payload);
      } else {
        await createPartCategory(payload);
      }

      setIsModalOpen(false);
      setSelectedData(null);

      await fetchData();
    } catch (error) {
      console.error("Gagal menyimpan kategori Part:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePartCategory(deleteId);

      setDeleteId(null);
      await fetchData();
    } catch (error) {
      console.error("Gagal menghapus kategori Part:", error);
    }
  };

  return (
    <>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h2 className="text-lg font-semibold">
          Data Kategori Part
        </h2>

        <button
          type="button"
          onClick={() => {
            setSelectedData(null);
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Kategori Part
        </button>
      </div>

      {/* SEARCH */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Cari kategori atau nama Part..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full md:w-1/2 lg:w-1/3 border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            Memuat data kategori Part...
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border rounded-lg">
            Belum ada data Kategori Part.
          </div>
        ) : (
          data.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
            >
              <div className="min-w-0">
                <p className="font-medium text-gray-900 break-words">
                  {item.name}
                </p>

                <p className="text-sm text-gray-500 mt-1">
                  Part: {item.part?.name || "-"}
                </p>

                <p className="text-xs text-gray-400">
                  Project: {item.part?.project?.name || "-"}
                </p>
              </div>

              <div className="flex gap-4 items-center shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedData(item);
                    setIsModalOpen(true);
                  }}
                  className="text-orange-600 hover:text-orange-800"
                  title="Edit Kategori Part"
                >
                  <FiEdit2 size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteId(item.id)}
                  className="text-red-500 hover:text-red-700"
                  title="Hapus Kategori Part"
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
        <div className="flex justify-center items-center mt-6 gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          <span className="px-3 py-1 text-sm">
            Page {page} of {totalPage}
          </span>

          <button
            disabled={page >= totalPage}
            onClick={() => setPage((prev) => prev + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT */}
      <PartCategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedData(null);
        }}
        onSubmit={handleSubmit}
        initialData={selectedData}
        parts={parts}
      />

      {/* MODAL KONFIRMASI HAPUS */}
      <DeleteConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}