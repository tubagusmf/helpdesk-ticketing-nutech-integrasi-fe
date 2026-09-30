import { useState } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

import DeleteConfirmModal from "../../components/modal/DeleteConfirmModal";

export default function UserTab({
  users,
  page,
  limit,
  totalPage,
  search,
  setSearch,
  setPage,
  setLimit,
  onEdit,
  onDelete,
}) {
  const [deleteModal, setDeleteModal] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedUser) {
      await onDelete(selectedUser.id);
    }

    setDeleteModal(false);
    setSelectedUser(null);
  };

  const getInitial = (name) => {
    if (!name) {
      return "U";
    }

    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getRoleName = (user) => {
    return user?.role?.name || "-";
  };

  const hasProjects =
    Array.isArray(users) &&
    users.some(
      (user) => Array.isArray(user.projects) && user.projects.length > 0,
    );

  const renderEmptyState = () => (
    <div className="py-10 text-center text-sm text-gray-500">
      Tidak ada pengguna ditemukan.
    </div>
  );

  const renderMobileUserCard = (user) => (
    <div
      key={user.id}
      className="
        border
        border-gray-200
        rounded-xl
        bg-white
        p-4
        shadow-sm
      "
    >
      {/* USER HEADER */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* INITIAL */}
          <div
            className="
              w-10
              h-10
              shrink-0
              flex
              items-center
              justify-center
              rounded-full
              bg-orange-500
              text-white
              text-xs
              font-bold
            "
          >
            {getInitial(user.name)}
          </div>

          {/* NAME */}
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 break-words">
              {user.name || "-"}
            </p>

            <p className="text-xs text-gray-500 break-all mt-1">
              {user.email || "-"}
            </p>
          </div>
        </div>

        {/* ACTION */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(user)}
            className="
              p-2
              text-orange-600
              rounded-lg
              hover:bg-orange-100
              transition
            "
            title="Edit user"
          >
            <FiEdit2 size={18} />
          </button>

          <button
            type="button"
            onClick={() => handleDeleteClick(user)}
            className="
              p-2
              text-red-600
              rounded-lg
              hover:bg-red-100
              transition
            "
            title="Hapus user"
          >
            <FiTrash2 size={18} />
          </button>
        </div>
      </div>

      {/* USER DETAILS */}
      <div
        className="
          mt-4
          pt-4
          border-t
          border-gray-100
          space-y-3
        "
      >
        {/* ROLE */}
        <div>
          <p className="text-[11px] font-semibold uppercase text-gray-400">
            Privilege / Role
          </p>

          <div className="mt-1">
            <span
              className="
                inline-flex
                max-w-full
                px-2
                py-1
                text-xs
                rounded
                bg-orange-100
                text-orange-700
                break-words
              "
            >
              {getRoleName(user)}
            </span>
          </div>
        </div>

        {/* STATUS */}
        <div>
          <p className="text-[11px] font-semibold uppercase text-gray-400">
            Status
          </p>

          <div className="mt-1">
            <span
              className={`
                inline-flex
                items-center
                gap-1
                w-fit
                px-2
                py-1
                text-xs
                rounded

                ${
                  user.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-200 text-gray-600"
                }
              `}
            >
              <span className="text-[10px]">●</span>

              {user.is_active ? "Online" : "Offline"}
            </span>
          </div>
        </div>

        {/* PROJECT ACCESS */}
        <div>
          <p className="text-[11px] font-semibold uppercase text-gray-400">
            Akses Project
          </p>

          <div className="flex flex-wrap gap-1 mt-1">
            {user.projects?.length > 0 ? (
              user.projects.map((project) => (
                <span
                  key={project.id}
                  className="
                    inline-flex
                    max-w-full
                    text-xs
                    bg-gray-100
                    text-gray-700
                    px-2
                    py-1
                    rounded
                    break-words
                  "
                >
                  {project.name}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400">Tidak ada project</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full min-w-0">
      <div className="mb-4 sm:mb-6">
        <input
          type="text"
          placeholder="Cari nama, email, role, atau project..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="
            w-full
            border
            border-gray-300
            bg-white
            px-3
            py-2.5
            rounded-lg
            text-sm
            focus:outline-none
            focus:border-blue-500
            focus:ring-1
            focus:ring-blue-500
            transition
          "
        />
      </div>

      <div className="hidden md:block w-full min-w-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left p-3 whitespace-nowrap">Nama Pengguna</th>

              <th className="text-left p-3 whitespace-nowrap">Email</th>

              <th className="text-left p-3 whitespace-nowrap">
                Privilege / Role
              </th>

              <th className="text-left p-3 whitespace-nowrap">Status</th>

              <th className="text-left p-3">Akses Project</th>

              <th className="text-center p-3 whitespace-nowrap">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {users?.length > 0 ? (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="
                    border-b
                    hover:bg-gray-50
                    transition
                  "
                >
                  {/* USER */}
                  <td className="p-3">
                    <div className="flex items-center gap-3 min-w-[180px]">
                      <div
                        className="
                          w-9
                          h-9
                          shrink-0
                          flex
                          items-center
                          justify-center
                          rounded-full
                          bg-orange-500
                          text-white
                          text-xs
                          font-bold
                        "
                      >
                        {getInitial(user.name)}
                      </div>

                      <span className="font-medium break-words">
                        {user.name || "-"}
                      </span>
                    </div>
                  </td>

                  {/* EMAIL */}
                  <td className="p-3 text-gray-600">
                    <span className="break-all">{user.email || "-"}</span>
                  </td>

                  {/* ROLE */}
                  <td className="p-3">
                    <span
                      className="
                        inline-flex
                        px-2
                        py-1
                        text-xs
                        rounded
                        bg-orange-100
                        text-orange-700
                        whitespace-nowrap
                      "
                    >
                      {getRoleName(user)}
                    </span>
                  </td>

                  {/* STATUS */}
                  <td className="p-3">
                    <span
                      className={`
                        inline-flex
                        items-center
                        gap-1
                        w-fit
                        px-2
                        py-1
                        text-xs
                        rounded
                        whitespace-nowrap

                        ${
                          user.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-600"
                        }
                      `}
                    >
                      <span className="text-[10px]">●</span>

                      {user.is_active ? "Online" : "Offline"}
                    </span>
                  </td>

                  {/* PROJECT */}
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1 min-w-[150px]">
                      {user.projects?.length > 0 ? (
                        user.projects.map((project) => (
                          <span
                            key={project.id}
                            className="
                                text-xs
                                bg-gray-200
                                text-gray-700
                                px-2
                                py-1
                                rounded
                                break-words
                              "
                          >
                            {project.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">
                          Tidak ada project
                        </span>
                      )}
                    </div>
                  </td>

                  {/* ACTION */}
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(user)}
                        className="
                          p-2
                          text-orange-600
                          rounded-lg
                          hover:bg-orange-100
                          transition
                        "
                        title="Edit user"
                      >
                        <FiEdit2 size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteClick(user)}
                        className="
                          p-2
                          text-red-600
                          rounded-lg
                          hover:bg-red-100
                          transition
                        "
                        title="Hapus user"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  Tidak ada pengguna ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {users?.length > 0
          ? users.map((user) => renderMobileUserCard(user))
          : renderEmptyState()}
      </div>

      <div
        className="
          flex
          flex-col
          sm:flex-row
          sm:justify-between
          sm:items-center
          gap-4
          mt-6
          w-full
        "
      >

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="whitespace-nowrap">Rows per page:</span>

          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="
              border
              border-gray-300
              bg-white
              rounded-md
              px-2
              py-1.5
              text-sm
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
            "
          >
            <option value={10}>10</option>

            <option value={25}>25</option>

            <option value={50}>50</option>
          </select>
        </div>

        {/* PAGINATION */}
        <div
          className="
            flex
            items-center
            gap-2
            w-full
            sm:w-auto
          "
        >
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="
              px-3
              py-1.5
              border
              rounded
              text-sm
              disabled:opacity-50
              disabled:cursor-not-allowed
              hover:bg-gray-50
              transition
            "
          >
            Prev
          </button>

          <span
            className="
              flex-1
              sm:flex-none
              text-center
              px-2
              sm:px-3
              py-1.5
              text-sm
              text-gray-600
              whitespace-nowrap
            "
          >
            Page {page} of {totalPage}
          </span>

          <button
            type="button"
            disabled={page === totalPage}
            onClick={() => setPage(page + 1)}
            className="
              px-3
              py-1.5
              border
              rounded
              text-sm
              disabled:opacity-50
              disabled:cursor-not-allowed
              hover:bg-gray-50
              transition
            "
          >
            Next
          </button>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
