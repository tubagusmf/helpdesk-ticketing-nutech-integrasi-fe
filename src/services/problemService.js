const BASE_URL = `${import.meta.env.VITE_API_URL}/v1/problems`;

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

async function handleResponse(res) {
  const result = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      result.message || "Terjadi kesalahan pada server",
    );
  }

  return result;
}

export async function getProblems(page = 1, search = "", limit = 10) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    name: search,
  });

  const res = await fetch(
    `${BASE_URL}?${params.toString()}`,
    {
      headers: getHeaders(),
    },
  );

  const result = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      result.message || "Gagal mengambil data permasalahan",
    );
  }

  return result;
}

export async function getAllProblems() {
  const firstResponse = await getProblems(1, "", 50);

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
      (_, index) => getProblems(index + 2, "", 50),
    ),
  );

  return [
    ...firstData,
    ...remainingResponses.flatMap((response) =>
      Array.isArray(response?.data) ? response.data : [],
    ),
  ];
}

export async function createProblem(data) {
  const res = await fetch(`${BASE_URL}/create`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse(res);
}

export async function updateProblem(id, data) {
  const res = await fetch(
    `${BASE_URL}/update/${id}`,
    {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    },
  );

  return handleResponse(res);
}

export async function deleteProblem(id) {
  const res = await fetch(
    `${BASE_URL}/delete/${id}`,
    {
      method: "DELETE",
      headers: getHeaders(),
    },
  );

  return handleResponse(res);
}

export async function getProblemsByPartId(partId) {
  if (!partId) {
    return { data: [] };
  }

  const res = await fetch(
    `${BASE_URL}/part/${encodeURIComponent(partId)}`,
    {
      headers: getHeaders(),
    },
  );

  return handleResponse(res);
}