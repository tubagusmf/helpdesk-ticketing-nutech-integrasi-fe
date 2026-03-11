import { useEffect, useState } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import DeleteConfirmModal from "../../components/modal/DeleteConfirmModal";

export default function UserTab({
  users,
  page,
  totalPage,
  search,
  setSearch,
  setPage,
  onEdit,
  onDelete
}) {

  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (selectedUser) {
      onDelete(selectedUser.id);
    }
  
    setDeleteModal(false);
    setSelectedUser(null);
  };

    const getInitial = (name) => {
      return name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
    };
  
    return (
      <div className="overflow-x-auto">

        <div className="mb-6">
          <input
            type="text"
            placeholder="Cari nama project..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full md:w-1/2 lg:w-1/3 border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <table className="w-full text-sm">
  
          <thead className="border-b text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left p-3">Nama Pengguna</th>
              <th>Email</th>
              <th>Privilege / Role</th>
              <th>Status</th>
              <th>Akses Project</th>
              <th className="text-center">Aksi</th>
            </tr>
          </thead>
  
          <tbody>
  
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
  
                <td className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 flex items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold">
                    {getInitial(user.name)}
                  </div>
  
                  <span className="font-medium">
                    {user.name}
                  </span>
                </td>
  
                <td className="text-gray-600">
                  {user.email}
                </td>
  
                <td>
                    <div className="flex gap-2">
                        <span className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-700">
                        {user.role?.name}
                        </span>
                    </div>
                </td>
  
                <td>
                    <span
                        className={`
                        flex items-center gap-1 w-fit px-2 py-1 text-xs rounded
                        ${user.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-600"}
                        `}
                    >
                        <span className="text-xs">●</span>
                        {user.is_active ? "Online" : "Offline"}
                    </span>
                </td>
  
                <td className="flex flex-wrap gap-1">
                {user.projects?.map((p) => (
                    <span
                    key={p.id}
                    className="text-xs bg-gray-200 px-2 py-1 rounded"
                    >
                    {p.name}
                    </span>
                ))}
                </td>
                
                <td className="text-center space-x-2">
  
                  <button
                    onClick={() => onEdit(user)}
                    className="px-3 py-1 text-xs bg-orange-50 text-orange-600 rounded hover:bg-orange-100"
                  >
                    <FiEdit2 size={18} />
                  </button>
  
                  <button
                    onClick={() => handleDeleteClick(user)}
                    className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100"
                  >
                    <FiTrash2 size={18} />
                  </button>
  
                </td>
  
              </tr>
            ))}
  
          </tbody>
        </table>

        <div className="flex justify-center mt-6 gap-2">

          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          <span className="px-3 py-1">
            Page {page} of {totalPage}
          </span>

          <button
            disabled={page === totalPage}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>

        </div>

        <DeleteConfirmModal
          isOpen={deleteModal}
          onClose={() => setDeleteModal(false)}
          onConfirm={handleConfirmDelete}
        />

      </div>
    );
  }