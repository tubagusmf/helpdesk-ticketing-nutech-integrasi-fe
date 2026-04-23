const BASE_URL = "http://localhost:3000/v1";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const fetchAPI = async (url, options = {}) => {
  const res = await fetch(url, options);

  let result;
  try {
    result = await res.json();
  } catch {
    result = null;
  }

  if (!res.ok) {
    throw new Error(result?.message || "Terjadi kesalahan pada server");
  }

  return result;
};

export const getDashboardSummary = async (filters = {}) => {
  const query = new URLSearchParams(filters).toString();

  return fetchAPI(`${BASE_URL}/dashboard/summary?${query}`, {
    headers: getHeaders(),
  });
};

export const getStatusDistribution = async (filters = {}) => {
  const query = new URLSearchParams(filters).toString();

  return fetchAPI(`${BASE_URL}/dashboard/status-distribution?${query}`, {
    headers: getHeaders(),
  });
};

export const getPriorityDistribution = async (filters = {}) => {
  const query = new URLSearchParams(filters).toString();

  return fetchAPI(`${BASE_URL}/dashboard/priority?${query}`, {
    headers: getHeaders(),
  });
};

export const getVolumePerProject = async (filters = {}) => {
  const query = new URLSearchParams(filters).toString();

  return fetchAPI(`${BASE_URL}/dashboard/volume-project?${query}`, {
    headers: getHeaders(),
  });
};