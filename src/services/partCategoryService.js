const BASE_URL = `${import.meta.env.VITE_API_URL}/v1/part-categories`;

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export async function getPartCategories(
  page = 1,
  search = "",
  partId = "",
  limit = 10
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    name: search,
  });

  if (partId) {
    params.set("part_id", String(partId));
  }

  const res = await fetch(`${BASE_URL}?${params.toString()}`, {
    headers: getHeaders(),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(
      result?.message || "Gagal mengambil data Kategori Part"
    );
  }

  return result;
}

export async function getPartCategoryById(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    headers: getHeaders(),
  });

  return res.json();
}

export async function getPartCategoriesByPartId(partId) {
  const res = await fetch(`${BASE_URL}/part/${partId}`, {
    headers: getHeaders(),
  });

  return res.json();
}

export async function createPartCategory(data) {
  const res = await fetch(`${BASE_URL}/create`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function updatePartCategory(id, data) {
  const res = await fetch(`${BASE_URL}/update/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function deletePartCategory(id) {
  const res = await fetch(`${BASE_URL}/delete/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  return res.json();
}