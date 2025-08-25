import { useEffect, useState } from "react";
import axios from "axios";

export default function AdminDashboard() {
  const [lists, setLists] = useState([]);
  const [file, setFile] = useState(null);
  const [listName, setListName] = useState("");
  const [agents, setAgents] = useState([]);
  const [agentForm, setAgentForm] = useState({ name: "", email: "", mobile: "", password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [showAddAgent, setShowAddAgent] = useState(false);
  const [showAgentsList, setShowAgentsList] = useState(false);

  const token = localStorage.getItem("token");

  // ================== Fetch Lists ==================
  const fetchLists = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/lists", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLists(res.data);
    } catch (err) {
      setError("Failed to fetch lists");
    } finally {
      setLoading(false);
    }
  };

  // ================== Fetch Agents ==================
  const fetchAgents = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/agents", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAgents(res.data);
    } catch (err) {
      setError("Failed to fetch agents");
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  // ================== Upload List ==================
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

  // ================== Delete List ==================
  const handleDeleteList = async (id) => {
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

  // ================== Create Agent ==================
  const handleAgentChange = (e) => {
    setAgentForm({ ...agentForm, [e.target.name]: e.target.value });
  };

  const handleAddAgent = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/agents/create", agentForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage(res.data.message);
      setAgentForm({ name: "", email: "", mobile: "", password: "" });
      fetchAgents();
      setShowAddAgent(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create agent");
    }
  };

  // ================== Delete Agent ==================
  const handleDeleteAgent = async (id) => {
    if (!window.confirm("Delete this agent?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/agents/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAgents();
    } catch (err) {
      setError("Failed to delete agent");
    }
  };

  // ================== Auto Clear Messages ==================
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

      {/* ================== Add Agent Button & Form ================== */}
      <button className="btn btn-success mb-2 mx-2" onClick={() => setShowAddAgent(!showAddAgent)}>
        {showAddAgent ? "Close Add Agent" : "Add Agent"}
      </button>

      {showAddAgent && (
        <form onSubmit={handleAddAgent} className="mb-4">
          <div className="mb-2">
            <input type="text" className="form-control" placeholder="Name"
              name="name" value={agentForm.name} onChange={handleAgentChange} required />
          </div>
          <div className="mb-2">
            <input type="email" className="form-control" placeholder="Email"
              name="email" value={agentForm.email} onChange={handleAgentChange} required />
          </div>
          <div className="mb-2">
            <input type="text" className="form-control" placeholder="Mobile"
              name="mobile" value={agentForm.mobile} onChange={handleAgentChange} required />
          </div>
          <div className="mb-2">
            <input type="password" className="form-control" placeholder="Password"
              name="password" value={agentForm.password} onChange={handleAgentChange} required />
          </div>
          <button className="btn btn-success">Save Agent</button>
        </form>
      )}

      {/* ================== View Agents Button & Table ================== */}
      <button className="btn btn-primary mb-2" onClick={() => {
        setShowAgentsList(!showAgentsList);
        if (!showAgentsList) fetchAgents();
      }}>
        {showAgentsList ? "Hide Agents" : "View Agents"}
      </button>

      {showAgentsList && (
        <table className="table table-bordered mb-4">
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Mobile</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {agents.length ? (
              agents.map((agent) => (
                <tr key={agent._id}>
                  <td>{agent.name}</td>
                  <td>{agent.email}</td>
                  <td>{agent.mobile}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteAgent(agent._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4" className="text-center">No agents yet.</td></tr>
            )}
          </tbody>
        </table>
      )}

      {/* ================== Upload List ================== */}
      <h4>Upload List</h4>
      <form onSubmit={handleUpload} className="mb-4">
        <div className="mb-2">
          <input type="text" className="form-control"
            placeholder="List Name" value={listName}
            onChange={(e) => setListName(e.target.value)} />
        </div>
        <div className="mb-2">
          <input type="file" accept=".csv,.xlsx,.xls"
            className="form-control"
            onChange={(e) => setFile(e.target.files[0])} />
        </div>
        <button className="btn btn-primary">Upload</button>
      </form>

      {/* ================== Lists ================== */}
      <h4>Uploaded Lists</h4>
      {loading ? (
        <p>Loading lists...</p>
      ) : (
        <table className="table table-bordered">
          <thead>
            <tr><th>Name</th><th>Uploaded By</th><th>Created</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {lists.length ? (
              lists.map((list) => (
                <tr key={list._id}>
                  <td>{list.name}</td>
                  <td>{list.uploadedBy?.name || "Unknown"}</td>
                  <td>{new Date(list.createdAt).toLocaleString()}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteList(list._id)}>Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4" className="text-center">No lists uploaded yet.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
