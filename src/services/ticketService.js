const BASE_URL = "http://localhost:3000/v1";

const getHeaders = (isJSON = true) => {
  const headers = {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };

  if (isJSON) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
};

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

export const getTickets = async (filters = {}) => {
  const query = new URLSearchParams(filters).toString();
  return fetchAPI(`${BASE_URL}/tickets?${query}`, {
    headers: getHeaders(),
  });
};

export const getTicketById = async (id) => {
  return fetchAPI(`${BASE_URL}/tickets/${id}`, {
    headers: getHeaders(),
  });
};

export const createTicket = async (formData) => {
  return fetchAPI(`${BASE_URL}/tickets/create`, {
    method: "POST",
    headers: getHeaders(false),
    body: formData,
  });
};

export const updateTicketStatus = async (id, data) => {
  return fetchAPI(`${BASE_URL}/tickets/update-status/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
};

export const updateTicketStatusOnly = async (id, status) => {
  return fetchAPI(`${BASE_URL}/tickets/${id}/status`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  });
};

export const deleteTicket = async (id) => {
  return fetchAPI(`${BASE_URL}/tickets/delete/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
};

export const createTicketResolution = async (ticketId, formData) => {
  return fetchAPI(`${BASE_URL}/tickets/${ticketId}/resolution`, {
    method: "POST",
    headers: getHeaders(false),
    body: formData,
  });
};

export const getProjects = async () => {
  return fetchAPI(`${BASE_URL}/projects`, {
    headers: getHeaders(),
  });
};

export const getLocations = async (projectId) => {
  return fetchAPI(`${BASE_URL}/locations?project_id=${projectId}`, {
    headers: getHeaders(),
  });
};

export const getParts = async (projectId) => {
  return fetchAPI(`${BASE_URL}/parts?project_id=${projectId}`, {
    headers: getHeaders(),
  });
};

export const getAssets = async (partId) => {
  return fetchAPI(`${BASE_URL}/asset-id?part_id=${partId}`, {
    headers: getHeaders(),
  });
};

export const getStaffs = async () => {
  return fetchAPI(`${BASE_URL}/users?role_id=2&is_active=true`, {
    headers: getHeaders(),
  });
};

export const getCauses = async (partId) => {
  return fetchAPI(`${BASE_URL}/causes?part_id=${partId}&limit=100`, {
    headers: getHeaders(),
  });
};

export const getSolutions = async (causeId) => {
  return fetchAPI(`${BASE_URL}/solutions?cause_id=${causeId}&limit=100`, {
    headers: getHeaders(),
  });
};