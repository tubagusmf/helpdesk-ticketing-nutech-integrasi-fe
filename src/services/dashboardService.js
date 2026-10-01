const BASE_URL = `${import.meta.env.VITE_API_URL}/v1`;

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

export const getDashboardProjects = async () => {
  return fetchAPI(`${BASE_URL}/dashboard/projects`, {
    headers: getHeaders(),
  });
};

export const getTopProjects = async (filters = {}) => {
  const query = new URLSearchParams(filters).toString();

  return fetchAPI(`${BASE_URL}/dashboard/top-projects?${query}`, {
    headers: getHeaders(),
  });
};

export const getTopLocations = async (filters = {}) => {
  const query = new URLSearchParams(filters).toString();

  return fetchAPI(`${BASE_URL}/dashboard/top-locations?${query}`, {
    headers: getHeaders(),
  });
};

export const getIncidentTrend = async (filters = {}) => {
  const query = new URLSearchParams(filters).toString();

  return fetchAPI(`${BASE_URL}/dashboard/incident-trend?${query}`, {
    headers: getHeaders(),
  });
};

export const getOpenTickets = async (filters = {}) => {
  const query = new URLSearchParams(filters).toString();

  return fetchAPI(`${BASE_URL}/dashboard/open-tickets?${query}`, {
    headers: getHeaders(),
  });
};

export const getOnHoldTickets = async (filters = {}) => {
  const query = new URLSearchParams(filters).toString();

  return fetchAPI(`${BASE_URL}/dashboard/onhold-tickets?${query}`, {
    headers: getHeaders(),
  });
};

export const getProjectSummary = async (filters = {}) => {
  const query = new URLSearchParams(filters).toString();

  return fetchAPI(`${BASE_URL}/dashboard/project-summary?${query}`, {
    headers: getHeaders(),
  });
};

export const getStaffSummary = async (filters = {}) => {
  const query = new URLSearchParams(filters).toString();

  return fetchAPI(`${BASE_URL}/dashboard/staff-summary?${query}`, {
    headers: getHeaders(),
  });
};