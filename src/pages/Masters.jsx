
import { useEffect, useState } from "react";
import API from "../services/api";

export default function Masters() {
  const [data, setData] = useState([]);
  const [name, setName] = useState("");

  const fetchData = async () => {
    const res = await API.get("/masters");
    setData(res.data);
  };

  const handleCreate = async () => {
    await API.post("/masters", { name });
    setName("");
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <h1 className="text-xl mb-4">Master Data</h1>
      <div className="mb-4">
        <input value={name} onChange={(e) => setName(e.target.value)}
          className="border p-2 mr-2" placeholder="Name" />
        <button onClick={handleCreate}
          className="bg-blue-500 text-white px-4 py-2 rounded">
          Add
        </button>
      </div>
      <ul className="bg-white rounded shadow p-4">
        {data.map((item) => (
          <li key={item.id} className="border-b py-2">{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
