import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {FiArrowLeft, FiDownload, FiExternalLink, FiFileText, FiLoader} from "react-icons/fi";
import DashboardLayout from "../components/layout/DashboardLayout";
import {getEngineerTicketResolution, getTicketById, getTicketResolution, markEngineerResolutionAsRead} from "../services/ticketService";
import { jwtDecode } from "jwt-decode";
import { navigationMenu } from "../constants/navigation";
import { ROLE } from "../constants/role";

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [resolution, setResolution] = useState(null);
  const [engineerResolutions, setEngineerResolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  const sortedEngineerResolutions = [
    ...engineerResolutions,
  ].sort((a, b) => {
    return (
      new Date(a.created_at || 0) -
      new Date(b.created_at || 0)
    );
  });

  const currentUser = token
    ? jwtDecode(token)
    : null;

  const rawRole =
    currentUser?.role_id ??
    currentUser?.role;

  const role =
    typeof rawRole === "string"
      ? (
          rawRole === "ADMINISTRATOR"
            ? ROLE.ADMINISTRATOR
            : rawRole === "STAFF"
            ? ROLE.STAFF
            : rawRole === "USER"
            ? ROLE.USER
            : rawRole === "EXECUTIVE"
            ? ROLE.EXECUTIVE
            : rawRole === "ENGINEER"
            ? ROLE.ENGINEER
            : Number(rawRole)
        )
      : Number(rawRole);
      
  const menu =
    role === ROLE.ADMINISTRATOR
      ? navigationMenu.administrator
      : role === ROLE.STAFF
      ? navigationMenu.staff
      : role === ROLE.USER
      ? navigationMenu.user
      : role === ROLE.EXECUTIVE
      ? navigationMenu.executive
      : role === ROLE.ENGINEER
      ? navigationMenu.engineer
      : [];

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError("");
        const ticketData =
          await getTicketById(id);

        setTicket(ticketData);

        try {
          const resolutionData =
            await getTicketResolution(id);

          setResolution(
            resolutionData
          );
        } catch (err) {
          console.error(
            "[TICKET DETAIL] Failed to fetch ticket resolution:",
            err
          );

          setResolution(null);
        }

        try {
          const engineerResolutionData =
            await getEngineerTicketResolution(id);

          console.log(
            "[TICKET DETAIL] ENGINEER RESOLUTION:",
            engineerResolutionData
          );

          let resolutions = [];

          if (
            Array.isArray(
              engineerResolutionData
            )
          ) {
            resolutions =
              engineerResolutionData;
          } else if (
            engineerResolutionData
          ) {
            resolutions = [
              engineerResolutionData,
            ];
          }

          setEngineerResolutions(
            resolutions
          );

          if (resolutions.length > 0) {
            try {
              await markEngineerResolutionAsRead(
                id
              );
            } catch (readError) {
              console.error(
                "[TICKET DETAIL] Failed to mark engineer resolution as read:",
                readError
              );
            }
          }
        } catch (err) {
          console.error(
            "[TICKET DETAIL] Failed to fetch engineer resolution:",
            err
          );

          setEngineerResolutions([]);
        }
      } catch (err) {
        console.error(
          "[TICKET DETAIL] Error:",
          err
        );

        setError(
          err.message ||
            "Gagal mengambil detail tiket"
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDetail();
    }
  }, [id]);

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleString(
      "id-ID",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "OPEN":
        return "bg-red-100 text-red-600";

      case "IN_PROGRESS":
        return "bg-orange-100 text-orange-600";

      case "ONHOLD":
      case "PENDING":
        return "bg-blue-100 text-blue-600";

      case "RESOLVED":
      case "DONE":
        return "bg-green-100 text-green-600";

      case "CLOSED":
        return "bg-gray-200 text-gray-600";

      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-600 text-white";

      case "HIGH":
        return "bg-orange-500 text-white";

      case "MEDIUM":
        return "bg-blue-500 text-white";

      case "LOW":
        return "bg-gray-400 text-white";

      default:
        return "bg-gray-400 text-white";
    }
  };

  const downloadFile = async (file) => {
    try {
      const fileUrl =
        file.file_url ||
        file.fileUrl;

      const fileName =
        file.file_name ||
        file.fileName ||
        "attachment";

      if (!fileUrl) {
        throw new Error(
          "URL file tidak ditemukan"
        );
      }

      const response = await fetch(
        fileUrl,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "token"
            )}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Gagal mengunduh file"
        );
      }

      const blob =
        await response.blob();

      const url =
        window.URL.createObjectURL(
          blob
        );

      const anchor =
        document.createElement(
          "a"
        );

      anchor.href = url;

      anchor.download =
        fileName;

      document.body.appendChild(
        anchor
      );

      anchor.click();

      anchor.remove();

      window.URL.revokeObjectURL(
        url
      );
    } catch (err) {
      console.error(
        "[DOWNLOAD] Error:",
        err
      );

      const fileUrl =
        file.file_url ||
        file.fileUrl;

      if (fileUrl) {
        window.open(
          fileUrl,
          "_blank",
          "noopener,noreferrer"
        );
      }
    }
  };

  const renderAttachments = (
    attachments = []
  ) => {
    if (
      !attachments ||
      attachments.length === 0
    ) {
      return (
        <p className="text-sm text-gray-500">
          Tidak ada attachment.
        </p>
      );
    }

    return (
      <div className="space-y-2">

        {attachments.map(
          (file, index) => {
            const fileUrl =
              file.file_url ||
              file.fileUrl;

            const fileName =
              file.file_name ||
              file.fileName ||
              "Attachment";

            return (
              <div
                key={
                  file.id ||
                  `${fileName}-${index}`
                }
                className="flex items-center justify-between gap-3 border rounded-lg p-3 bg-gray-50"
              >

                {/* FILE */}
                <div className="flex items-center gap-3 min-w-0">

                  <FiFileText
                    className="text-gray-500 shrink-0"
                    size={20}
                  />

                  <span className="text-sm text-gray-700 truncate">
                    {fileName}
                  </span>

                </div>

                {/* ACTION */}
                <div className="flex items-center gap-2 shrink-0">

                  {/* BUKA */}
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border rounded-md text-blue-600 hover:bg-blue-50"
                  >
                    <FiExternalLink
                      size={14}
                    />

                    Buka
                  </a>

                  {/* UNDUH */}
                  <button
                    type="button"
                    onClick={() =>
                      downloadFile(file)
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border rounded-md text-green-600 hover:bg-green-50"
                  >
                    <FiDownload
                      size={14}
                    />

                    Unduh
                  </button>

                </div>

              </div>
            );
          }
        )}

      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout
        title="Detail Tiket"
        menu={menu}
      >

        <div className="bg-white rounded-xl shadow p-10 flex justify-center items-center">

          <div className="flex items-center gap-2 text-gray-500">

            <FiLoader className="animate-spin" />

            Memuat detail tiket...

          </div>

        </div>

      </DashboardLayout>
    );
  }

  if (error || !ticket) {
    return (
      <DashboardLayout
        title="Detail Tiket"
        menu={menu}
      >

        <div className="bg-white rounded-xl shadow p-6">

          <div className="text-red-500 mb-4">
            {error ||
              "Tiket tidak ditemukan"}
          </div>

          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
            className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
          >
            <FiArrowLeft />

            Kembali
          </button>

        </div>

      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Detail Tiket"
      menu={menu}
    >

      <div className="space-y-6">

        <div className="bg-white rounded-xl shadow p-6">

          <div className="flex items-center justify-between gap-4">

            <div>

              <button
                type="button"
                onClick={() =>
                  navigate(-1)
                }
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4"
              >
                <FiArrowLeft />

                Kembali
              </button>

              <h1 className="text-2xl font-semibold text-gray-800">
                {ticket.ticket_code}
              </h1>

              <p className="text-sm text-gray-500 mt-1">
                Detail informasi tiket
                helpdesk
              </p>

            </div>

            <div className="flex items-center gap-2">

              <span
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${getPriorityClass(
                  ticket.priority
                )}`}
              >
                {ticket.priority}
              </span>

              <span
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusClass(
                  ticket.status
                )}`}
              >
                {ticket.status}
              </span>

            </div>

          </div>

        </div>

        <section className="bg-white rounded-xl shadow p-6">

          <h2 className="text-lg font-semibold text-gray-800 mb-5">
            Informasi Tiket
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

            <DetailItem
              label="Nomor Tiket"
              value={
                ticket.ticket_code
              }
            />

            <DetailItem
              label="Project"
              value={
                ticket.project_name
              }
            />

            <DetailItem
              label="Location"
              value={
                ticket.location_name
              }
            />

            <DetailItem
              label="Part"
              value={
                ticket.part_name
              }
            />

            <DetailItem
              label="Asset"
              value={
                ticket.asset_code
              }
            />

            <DetailItem
              label="Pelapor"
              value={
                ticket.reporter_name
              }
            />

            <DetailItem
              label="Assigned To"
              value={
                ticket.assigned_to_name
              }
            />

            <DetailItem
              label="Priority"
              value={
                ticket.priority
              }
            />

            <DetailItem
              label="Status"
              value={
                ticket.status
              }
            />

            <DetailItem
              label="Dibuat"
              value={formatDate(
                ticket.created_at
              )}
            />

            <DetailItem
              label="Due At"
              value={formatDate(
                ticket.due_at
              )}
            />

          </div>

        </section>

        <section className="bg-white rounded-xl shadow p-6">

          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Permasalahan
          </h2>

          <div className="bg-gray-50 border rounded-lg p-4">

            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {ticket.description ||
                "-"}
            </p>

          </div>

        </section>

        <section className="bg-white rounded-xl shadow p-6">

          <h2 className="text-lg font-semibold text-gray-800 mb-5">
            Resolusi Tiket
          </h2>

          {!resolution ? (
            <div className="bg-gray-50 border rounded-lg p-4">

              <p className="text-sm text-gray-500">
                Belum ada resolusi
                tiket.
              </p>

            </div>
          ) : (
            <div className="space-y-5">

              {/* PENYEBAB */}
              <div>

                <p className="text-xs font-medium text-gray-500 mb-1">
                  Penyebab
                </p>

                <div className="bg-gray-50 border rounded-lg p-4">

                  <p className="text-sm text-gray-700">
                    {resolution.cause_name ||
                      resolution
                        .cause
                        ?.name ||
                      "-"}
                  </p>

                </div>

              </div>

              {/* SOLUSI */}
              <div>

                <p className="text-xs font-medium text-gray-500 mb-1">
                  Solusi
                </p>

                <div className="bg-gray-50 border rounded-lg p-4">

                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {resolution.solution_name ||
                      resolution
                        .solution
                        ?.name ||
                      resolution.solution ||
                      "-"}
                  </p>

                </div>

              </div>

              {/* ATTACHMENT */}
              <div>

                <p className="text-xs font-medium text-gray-500 mb-2">
                  Attachment
                </p>

                {renderAttachments(
                  resolution.attachments
                )}

              </div>

            </div>
          )}

        </section>

        <section className="bg-white rounded-xl shadow p-6">

          <div className="flex items-center justify-between mb-5">

            <div>

              <h2 className="text-lg font-semibold text-gray-800">
                Resolusi Engineer
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Solusi dan attachment
                yang diberikan oleh
                Engineer.
              </p>

            </div>

          </div>

          {engineerResolutions.length ===
          0 ? (
            <div className="bg-gray-50 border rounded-lg p-4">

              <p className="text-sm text-gray-500">
                Belum ada resolusi
                dari Engineer.
              </p>

            </div>
          ) : (
            <div className="space-y-5">

              {sortedEngineerResolutions.map(
              (
                engineerResolution,
                index
              ) => {

                const resolutionNumber =
                  index + 1;

                return (
                  <div
                    key={
                      engineerResolution.id ||
                      index
                    }
                    className="border rounded-xl p-5 bg-gray-50"
                  >

                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-5">

                      <div>

                        <p className="text-sm font-semibold text-gray-700">
                          Resolusi #
                          {resolutionNumber}
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(
                            engineerResolution.created_at
                          )}
                        </p>

                      </div>

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">

                      <DetailItem
                        label="Engineer ID"
                        value={
                          engineerResolution.engineer_id ||
                          engineerResolution.engineerId
                        }
                      />

                      <DetailItem
                        label="Dibuat"
                        value={formatDate(
                          engineerResolution.created_at
                        )}
                      />

                      <DetailItem
                        label="Diperbarui"
                        value={formatDate(
                          engineerResolution.updated_at
                        )}
                      />

                    </div>

                    <div>

                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Solusi Engineer
                      </p>

                      <div className="bg-white border rounded-lg p-4">

                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {engineerResolution.solution ||
                            "-"}
                        </p>

                      </div>

                    </div>

                    <div className="mt-5">

                      <p className="text-xs font-medium text-gray-500 mb-2">
                        Attachment Engineer
                      </p>

                      {renderAttachments(
                        engineerResolution.attachments
                      )}

                    </div>

                  </div>
                );
              }
            )}

            </div>
          )}

        </section>

      </div>

    </DashboardLayout>
  );
}

function DetailItem({
  label,
  value,
}) {
  return (
    <div>

      <p className="text-xs font-medium text-gray-500 mb-1">
        {label}
      </p>

      <p className="text-sm font-medium text-gray-800">
        {value || "-"}
      </p>

    </div>
  );
}