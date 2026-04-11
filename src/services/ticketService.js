const BASE_URL = "http://localhost:3000/v1/tickets";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export async function getTickets(filters = {}) {
  const query = new URLSearchParams(filters).toString();

  const res = await fetch(`${BASE_URL}?${query}`, {
    headers: getHeaders(),
  });

  return res.json();
}

export async function getTicketById(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    headers: getHeaders(),
  });

  return res.json();
}

export async function createTicket(data) {
  const res = await fetch(`${BASE_URL}/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: data,
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || "Gagal create ticket");
  }

  return result;
}

export async function updateTicketStatus(id, data) {
  const res = await fetch(`${BASE_URL}/update-status/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function deleteTicket(id) {
  const res = await fetch(`${BASE_URL}/delete/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  return res.json();
}

export async function getProjects() {
  const res = await fetch("http://localhost:3000/v1/projects", {
    headers: getHeaders(),
  });
  return res.json();
}

export async function getLocations(projectId) {
  const res = await fetch(
    `http://localhost:3000/v1/locations?project_id=${projectId}`,
    { headers: getHeaders() }
  );
  return res.json();
}

export async function getParts(projectId) {
  const res = await fetch(
    `http://localhost:3000/v1/parts?project_id=${projectId}`,
    { headers: getHeaders() }
  );
  return res.json();
}

export async function getAssets(partId) {
  const res = await fetch(
    `http://localhost:3000/v1/asset-id?part_id=${partId}`,
    { headers: getHeaders() }
  );
  return res.json();
}

export async function getStaffs() {
  const res = await fetch(
    "http://localhost:3000/v1/users?role_id=2&is_active=true",
    {
      headers: getHeaders(),
    }
  );

  return res.json();
}

export const createTicketResolution = async (ticketId, formData) => {
  const res = await fetch(
    `${BASE_URL}/${ticketId}/resolution`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    }
  );

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || "Gagal resolve ticket");
  }

  return result;
};

export async function getCauses(partId) {
  const res = await fetch(
    `http://localhost:3000/v1/causes?part_id=${partId}&limit=100`,
    {
      headers: getHeaders(),
    }
  );

  return res.json();
}

export async function getSolutions(causeId) {
  const res = await fetch(
    `http://localhost:3000/v1/solutions?cause_id=${causeId}&limit=100`,
    {
      headers: getHeaders(),
    }
  );

  return res.json();
}

export async function updateTicketStatusOnly(id, status) {
  const res = await fetch(`${BASE_URL}/${id}/status`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({
      status: status,
    }),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || "Gagal update status");
  }

  return result;
}