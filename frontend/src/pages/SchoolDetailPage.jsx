import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';

export default function SchoolDetailPage() {
  const { id } = useParams();

  const [school, setSchool] = useState(null);

  useEffect(() => {
    loadSchool();
  }, []);

  const loadSchool = async () => {
    try {
      const res = await api.get('/admin/schools');
      const found = res.data.find(s => String(s.id) === String(id));
      setSchool(found);
    } catch (err) {
      console.error(err);
    }
  };

  if (!school) {
    return <div style={{ padding: 20 }}>Loading...</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>{school.name}</h1>

      <div style={{
        background: '#fff',
        padding: 20,
        borderRadius: 10,
        marginTop: 20
      }}>
        <p><strong>School Code:</strong> {school.code}</p>
        <p><strong>Type:</strong> {school.type}</p>
        <p><strong>City:</strong> {school.city}</p>
        <p><strong>State:</strong> {school.state}</p>
        <p><strong>Session:</strong> {school.current_session}</p>

        <p>
          <strong>Status:</strong>{" "}
          {school.is_active ? 'Active' : 'Inactive'}
        </p>
      </div>
    </div>
  );
}
