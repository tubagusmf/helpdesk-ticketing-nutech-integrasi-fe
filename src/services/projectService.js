const BASE_URL = "http://localhost:3000/v1/projects";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export async function getProjects(page = 1, search = "") {
    const res = await fetch(
      `http://localhost:3000/v1/projects?page=${page}&limit=10&name=${search}`,
      {
        headers: getHeaders(),
      }
    );
  
    return res.json();
}

export async function createProject(data) {
  const res = await fetch(`${BASE_URL}/create`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateProject(id, data) {
  const res = await fetch(`${BASE_URL}/update/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteProject(id) {
  const res = await fetch(`${BASE_URL}/delete/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return res.json();
}