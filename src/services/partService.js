const BASE_URL = `${import.meta.env.VITE_API_URL}/v1/parts`;

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export async function getParts(page = 1, search = "", limit = 10) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    name: search.trim(),
  });

  const res = await fetch(`${BASE_URL}?${params.toString()}`, {
    headers: getHeaders(),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(
      result?.message || "Gagal mengambil data Part"
    );
  }

  return result;
}

export async function createPart(data) {
  const res = await fetch(`${BASE_URL}/create`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function updatePart(id, data) {
  const res = await fetch(`${BASE_URL}/update/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function deletePart(id) {
  const res = await fetch(`${BASE_URL}/delete/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  return res.json();
}

export async function getPartsByProjectId(projectId) {
  const res = await fetch(`${BASE_URL}/project/${projectId}`, {
    headers: getHeaders(),
  });

  return res.json();
}

export async function getAllParts(search = "") {
  const firstResponse = await getParts(1, search, 1000);

  const firstData = Array.isArray(firstResponse?.data)
    ? firstResponse.data
    : [];

  const totalPage = Math.max(
    Number(firstResponse?.total_page) || 1,
    1,
  );

  if (totalPage === 1) {
    return firstData;
  }

  const remainingResponses = await Promise.all(
    Array.from(
      { length: totalPage - 1 },
      (_, index) => getParts(index + 2, search, 1000),
    ),
  );

  return [
    ...firstData,
    ...remainingResponses.flatMap((response) =>
      Array.isArray(response?.data) ? response.data : [],
    ),
  ];
}