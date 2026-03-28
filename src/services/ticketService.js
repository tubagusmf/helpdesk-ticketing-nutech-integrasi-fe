const BASE_URL = "http://localhost:3000/v1/tickets";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export async function getTickets() {
  const res = await fetch(BASE_URL, {
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
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  return res.json();
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