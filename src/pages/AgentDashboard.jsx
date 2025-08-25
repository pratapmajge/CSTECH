// src/pages/AgentDashboard.jsx
import { useEffect, useState } from "react";
import axios from "axios";

export default function AgentDashboard() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  const fetchAssignments = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/assignments/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  return (
    <div className="container mt-4">
      <h2>Agent Dashboard</h2>

      {loading ? (
        <p>Loading assignments...</p>
      ) : (
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>First Name</th>
              <th>Phone</th>
              <th>Notes</th>
              <th>List</th>
            </tr>
          </thead>
          <tbody>
            {assignments.length ? (
              assignments.map((a) => (
                <tr key={a._id}>
                  <td>{a.record.firstName}</td>
                  <td>{a.record.phone}</td>
                  <td>{a.record.notes}</td>
                  <td>{a.listId?.name || "N/A"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center">
                  No assigned records.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
