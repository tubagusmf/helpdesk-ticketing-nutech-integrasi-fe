const BASE_URL = "http://localhost:3000/v1/users";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export async function getUsers(page = 1, search = "") {
    const res = await fetch(
      `${BASE_URL}?page=${page}&name=${search}`,
      { headers: getHeaders() }
    );
  
    return res.json();
  }

export async function createUser(data) {
  const res = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function updateUser(id, data) {
  const res = await fetch(`${BASE_URL}/update/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function deleteUser(id) {
  const res = await fetch(`${BASE_URL}/delete/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  return res.json();
}