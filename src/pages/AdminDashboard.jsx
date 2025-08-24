import { useEffect, useState } from "react";
import axios from "axios";

export default function AdminDashboard() {
  const [lists, setLists] = useState([]);
  const [file, setFile] = useState(null);
  const [listName, setListName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");   // ✅ separate error state
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const fetchLists = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/lists", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLists(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch lists");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!file || !listName) {
      setError("Please enter list name and select file.");
      return;
    }

    const formData = new FormData();
    formData.append("name", listName);
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:5000/api/lists/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setMessage(res.data.message);
      setFile(null);
      setListName("");
      fetchLists();
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this list?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/lists/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchLists();
    } catch (err) {
      setError("Failed to delete list");
    }
  };

  // ✅ auto-clear messages after 5 sec
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage("");
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  return (
    <div className="container mt-4">
      <h2>Admin Dashboard</h2>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleUpload} className="mb-4">
        <div className="mb-2">
          <input
            type="text"
            className="form-control"
            placeholder="List Name"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
          />
        </div>
        <div className="mb-2">
          <input
            type="file"
            accept=".csv"
            className="form-control"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>
        <button className="btn btn-primary">Upload</button>
      </form>

      <h4>Uploaded Lists</h4>
      {loading ? (
        <p>Loading lists...</p>
      ) : (
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Name</th>
              <th>Uploaded By</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {lists.length ? (
              lists.map((list) => (
                <tr key={list._id}>
                  <td>{list.name}</td>
                  <td>{list.uploadedBy?.name || "Unknown"}</td>
                  <td>{new Date(list.createdAt).toLocaleString()}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(list._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center">
                  No lists uploaded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
