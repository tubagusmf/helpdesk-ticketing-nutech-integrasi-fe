
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

export async function getProblems(page = 1, search = "") {
  const params = new URLSearchParams({
    page: String(page),
    limit: "10",
    name: search,
  });

  const res = await fetch(
    `${BASE_URL}?${params.toString()}`,
    {
      headers: getHeaders(),
    },
  );

  return handleResponse(res);
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
