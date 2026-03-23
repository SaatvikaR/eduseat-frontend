import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { addHall, addStudentsBulk, generateSeating, deleteStudents, deleteHalls } from '../api/eduseat';

export default function StaffPortal() {
  const navigate = useNavigate();
  const [halls, setHalls] = useState([{ block: '', hallName: '', totalBenches: '' }]);
  const [subjects, setSubjects] = useState([{ name: '', code: '', departments: [{ name: '', file: null, students: [] }] }]);
  const [generated, setGenerated] = useState(false);
  const [seating, setSeating] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('setup');
  const [downloadingChart, setDownloadingChart] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterHall, setFilterHall] = useState('');

  const addHallRow = () => setHalls([...halls, { block: '', hallName: '', totalBenches: '' }]);
  const updateHall = (i, field, value) => {
    const updated = [...halls]; updated[i][field] = value; setHalls(updated);
  };
  const addSubject = () => setSubjects([...subjects, { name: '', code: '', departments: [{ name: '', file: null, students: [] }] }]);
  const addDept = (si) => {
    const updated = [...subjects]; updated[si].departments.push({ name: '', file: null, students: [] }); setSubjects(updated);
  };
  const updateSubject = (si, field, value) => {
    const updated = [...subjects]; updated[si][field] = value; setSubjects(updated);
  };
  const updateDept = (si, di, field, value) => {
    const updated = [...subjects]; updated[si].departments[di][field] = value; setSubjects(updated);
  };
  const handleCSV = (si, di, file) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const updated = [...subjects];
        updated[si].departments[di].students = results.data.filter(r => r.name && r.regNo);
        updated[si].departments[di].file = file;
        setSubjects(updated);
        setMessage(`✅ Loaded ${updated[si].departments[di].students.length} students`);
      }
    });
  };

  const handleGenerate = async () => {
    setLoading(true); setMessage('');
    try {
      await deleteStudents(); await deleteHalls();
      for (const hall of halls) {
        if (hall.block && hall.hallName && hall.totalBenches) {
          await addHall({ block: hall.block, hallName: hall.hallName, totalBenches: parseInt(hall.totalBenches) });
        }
      }
      const allStudents = [];
      for (const subject of subjects) {
        for (const dept of subject.departments) {
          for (const student of dept.students) {
            allStudents.push({ name: student.name, regNo: student.regNo, department: dept.name, section: student.section || '' });
          }
        }
      }
      if (allStudents.length === 0) { setMessage('❌ No students loaded!'); setLoading(false); return; }
      await addStudentsBulk(allStudents);
      const res = await generateSeating();
      setSeating(res.data);
      setGenerated(true);
      setActiveTab('chart');
      setMessage(`✅ Seating Plan Generated for ${allStudents.length} students!`);
    } catch (err) { setMessage('❌ Error: ' + err.message); }
    setLoading(false);
  };

  const getHallGroups = () => {
    const groups = {};
    seating.forEach(s => {
      if (!groups[s.hallName]) groups[s.hallName] = { block: s.block, hallName: s.hallName, seats: [] };
      groups[s.hallName].seats.push(s);
    });
    return groups;
  };

  const getDeptColor = (dept) => {
    const colors = {
      'CSE': '#1a237e', 'AIDS': '#880e4f', 'ECE': '#1b5e20',
      'MECH': '#e65100', 'CIVIL': '#4a148c', 'IT': '#006064',
      'EEE': '#33691e', 'MBA': '#bf360c'
    };
    return colors[dept] || '#37474f';
  };

  const downloadChartPDF = async (hallName) => {
    setDownloadingChart(hallName);
    const element = document.getElementById(`chart-${hallName}`);
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`InvigilatorChart_${hallName}.pdf`);
    } catch (err) { alert('Error generating PDF'); }
    setDownloadingChart(null);
  };

  const exportToExcel = () => {
    const data = seating.map((s, i) => ({
      '#': i + 1,
      'Register No': s.regNo,
      'Student Name': s.studentName,
      'Department': s.department,
      'Block': s.block,
      'Hall': s.hallName,
      'Bench': `B-${s.benchNo}`,
      'Side': s.side === 'L' ? 'Left' : 'Right'
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    worksheet['!cols'] = [
      { wch: 5 }, { wch: 15 }, { wch: 20 },
      { wch: 10 }, { wch: 8 }, { wch: 10 },
      { wch: 8 }, { wch: 8 }
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Seating Plan');
    const hallGroups = getHallGroups();
    Object.values(hallGroups).forEach(({ hallName, seats }) => {
      const hallData = seats.map((s, i) => ({
        '#': i + 1,
        'Register No': s.regNo,
        'Student Name': s.studentName,
        'Department': s.department,
        'Bench': `B-${s.benchNo}`,
        'Side': s.side === 'L' ? 'Left' : 'Right'
      }));
      const hallSheet = XLSX.utils.json_to_sheet(hallData);
      hallSheet['!cols'] = [
        { wch: 5 }, { wch: 15 }, { wch: 20 },
        { wch: 10 }, { wch: 8 }, { wch: 8 }
      ];
      XLSX.utils.book_append_sheet(workbook, hallSheet, hallName);
    });
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `EduSeat_SeatingPlan_${new Date().toLocaleDateString()}.xlsx`);
  };

  const filteredSeating = seating.filter(s => {
    const matchesSearch = searchQuery === '' ||
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.regNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDept === '' || s.department === filterDept;
    const matchesHall = filterHall === '' || s.hallName === filterHall;
    return matchesSearch && matchesDept && matchesHall;
  });

  const inputStyle = { padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', width: '100%' };
  const btnStyle = { padding: '8px 16px', background: '#1a237e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' };
  const tabStyle = (active) => ({
    padding: '10px 24px', border: 'none', borderRadius: '8px 8px 0 0', cursor: 'pointer', fontWeight: 600, fontSize: '14px',
    background: active ? '#1a237e' : '#e0e0e0', color: active ? 'white' : '#555'
  });

  const hallGroups = getHallGroups();

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa' }}>
      <div style={{ background: '#1a237e', color: 'white', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Edu Seat | Examination Cell</h2>
        <button onClick={() => { localStorage.removeItem('eduseat_auth'); navigate('/'); }}
          style={{ ...btnStyle, background: '#e53935' }}>Logout</button>
      </div>

      <div style={{ maxWidth: '1100px', margin: '32px auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '0' }}>
          <button style={tabStyle(activeTab === 'setup')} onClick={() => setActiveTab('setup')}>⚙️ Setup</button>
          <button style={tabStyle(activeTab === 'chart')} onClick={() => setActiveTab('chart')} disabled={!generated}>📋 Invigilator Charts</button>
          <button style={tabStyle(activeTab === 'table')} onClick={() => setActiveTab('table')} disabled={!generated}>📊 Full Seating Table</button>
        </div>

        <div style={{ background: 'white', borderRadius: '0 12px 12px 12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>

          {/* SETUP TAB */}
          {activeTab === 'setup' && (
            <>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, color: '#1a237e' }}>Hall Capacity Configuration</h3>
                  <button onClick={addHallRow} style={btnStyle}>+ Add Block</button>
                </div>
                {halls.map((hall, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <input style={inputStyle} placeholder="Block (e.g. A)" value={hall.block} onChange={e => updateHall(i, 'block', e.target.value)} />
                    <input style={inputStyle} placeholder="Hall Name (e.g. A-101)" value={hall.hallName} onChange={e => updateHall(i, 'hallName', e.target.value)} />
                    <input style={inputStyle} placeholder="Total Benches" type="number" value={hall.totalBenches} onChange={e => updateHall(i, 'totalBenches', e.target.value)} />
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, color: '#1a237e' }}>Subject & Multi-Dept Mapping</h3>
                  <button onClick={addSubject} style={btnStyle}>+ Add Subject</button>
                </div>
                {subjects.map((subject, si) => (
                  <div key={si} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <input style={inputStyle} placeholder="Subject Name" value={subject.name} onChange={e => updateSubject(si, 'name', e.target.value)} />
                      <input style={inputStyle} placeholder="Subject Code" value={subject.code} onChange={e => updateSubject(si, 'code', e.target.value)} />
                    </div>
                    {subject.departments.map((dept, di) => (
                      <div key={di} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px', alignItems: 'center' }}>
                        <input style={inputStyle} placeholder="Department (e.g. CSE)" value={dept.name} onChange={e => updateDept(si, di, 'name', e.target.value)} />
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input type="file" accept=".csv" onChange={e => handleCSV(si, di, e.target.files[0])} style={{ fontSize: '13px' }} />
                          {dept.students.length > 0 && <span style={{ color: 'green', fontSize: '12px' }}>✅ {dept.students.length}</span>}
                        </div>
                      </div>
                    ))}
                    <button onClick={() => addDept(si)} style={{ ...btnStyle, background: 'transparent', color: '#1a237e', border: '1px solid #1a237e', marginTop: '8px' }}>+ Add Department</button>
                  </div>
                ))}
              </div>

              {message && (
                <div style={{ padding: '12px', background: message.includes('❌') ? '#ffebee' : '#e8f5e9', borderRadius: '8px', marginBottom: '16px', color: message.includes('❌') ? '#c62828' : '#2e7d32' }}>
                  {message}
                </div>
              )}

              <button onClick={handleGenerate} disabled={loading} style={{
                ...btnStyle, width: '100%', padding: '16px', fontSize: '16px',
                background: loading ? '#90a4ae' : '#1a237e',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'
              }}>
                {loading ? (
                  <>
                    <div style={{
                      width: '20px', height: '20px',
                      border: '3px solid rgba(255,255,255,0.3)',
                      borderTop: '3px solid white', borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Generating Seating Plan...
                  </>
                ) : '🚀 Generate Automated Seating'}
              </button>
            </>
          )}

          {/* INVIGILATOR CHART TAB */}
          {activeTab === 'chart' && (
            <div>
              <h3 style={{ color: '#1a237e', marginBottom: '8px' }}>Invigilator Seating Charts</h3>
              <p style={{ color: '#666', marginBottom: '24px', fontSize: '14px' }}>Room-wise charts for invigilators with department color coding.</p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
                {[...new Set(seating.map(s => s.department))].map(dept => (
                  <div key={dept} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '3px', background: getDeptColor(dept) }}></div>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{dept}</span>
                  </div>
                ))}
              </div>
              {Object.values(hallGroups).map(({ block, hallName, seats }) => {
                const maxBench = Math.max(...seats.map(s => s.benchNo));
                return (
                  <div key={hallName} style={{ marginBottom: '32px', border: '1px solid #e0e0e0', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ background: '#1a237e', color: 'white', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '16px' }}>Block {block} — Hall {hallName}</span>
                        <span style={{ marginLeft: '16px', fontSize: '13px', opacity: 0.8 }}>{seats.length} students | {maxBench} benches</span>
                      </div>
                      <button onClick={() => downloadChartPDF(hallName)} disabled={downloadingChart === hallName}
                        style={{ ...btnStyle, background: '#2e7d32', fontSize: '13px', padding: '6px 14px' }}>
                        {downloadingChart === hallName ? 'Generating...' : '⬇ Download PDF'}
                      </button>
                    </div>
                    <div id={`chart-${hallName}`} style={{ padding: '20px', background: 'white' }}>
                      <div style={{ textAlign: 'center', marginBottom: '16px', borderBottom: '2px solid #1a237e', paddingBottom: '12px' }}>
                        <h3 style={{ margin: 0, color: '#1a237e' }}>RAJALAKSHMI INSTITUTE OF TECHNOLOGY</h3>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>Invigilator Seating Chart — Block {block} | Hall {hallName} | Total Students: {seats.length}</p>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                        {Array.from({ length: maxBench }, (_, i) => {
                          const benchNum = i + 1;
                          const leftSeat = seats.find(s => s.benchNo === benchNum && s.side === 'L');
                          const rightSeat = seats.find(s => s.benchNo === benchNum && s.side === 'R');
                          return (
                            <div key={benchNum} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden', fontSize: '11px' }}>
                              <div style={{ background: '#f5f6fa', padding: '3px 6px', fontWeight: 700, color: '#1a237e', borderBottom: '1px solid #e0e0e0', textAlign: 'center' }}>
                                B-{String(benchNum).padStart(2, '0')}
                              </div>
                              {[leftSeat, rightSeat].map((seat, idx) => (
                                <div key={idx} style={{
                                  padding: '4px 6px',
                                  borderBottom: idx === 0 ? '1px solid #f0f0f0' : 'none',
                                  background: seat ? getDeptColor(seat.department) + '15' : '#fafafa',
                                  minHeight: '36px'
                                }}>
                                  {seat ? (
                                    <>
                                      <div style={{ fontWeight: 700, color: getDeptColor(seat.department), fontSize: '10px' }}>{idx === 0 ? 'L' : 'R'} — {seat.department}</div>
                                      <div style={{ color: '#333', fontSize: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{seat.studentName}</div>
                                      <div style={{ color: '#666', fontSize: '9px' }}>{seat.regNo}</div>
                                    </>
                                  ) : (
                                    <div style={{ color: '#ccc', fontSize: '10px' }}>{idx === 0 ? 'L' : 'R'} — Empty</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ marginTop: '16px', borderTop: '1px solid #e0e0e0', paddingTop: '10px', textAlign: 'center', color: '#999', fontSize: '11px' }}>
                        Generated by EduSeat — Exam Seating Management System | Rajalakshmi Institute of Technology
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* FULL TABLE TAB */}
          {activeTab === 'table' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ color: '#1a237e', margin: 0 }}>Complete Seating Record</h3>
                <button onClick={exportToExcel} style={{ ...btnStyle, background: '#2e7d32', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📥 Export as Excel
                </button>
              </div>

              {/* Search & Filter */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <input
                  placeholder="🔍 Search by name or reg number..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ padding: '10px 14px', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
                />
                <select
                  value={filterDept}
                  onChange={e => setFilterDept(e.target.value)}
                  style={{ padding: '10px 14px', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
                >
                  <option value="">All Departments</option>
                  {[...new Set(seating.map(s => s.department))].map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <select
                  value={filterHall}
                  onChange={e => setFilterHall(e.target.value)}
                  style={{ padding: '10px 14px', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
                >
                  <option value="">All Halls</option>
                  {[...new Set(seating.map(s => s.hallName))].map(hall => (
                    <option key={hall} value={hall}>{hall}</option>
                  ))}
                </select>
              </div>

              {/* Results count */}
              <p style={{ color: '#666', fontSize: '13px', marginBottom: '12px' }}>
                Showing <strong>{filteredSeating.length}</strong> of <strong>{seating.length}</strong> students
              </p>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#1a237e', color: 'white' }}>
                    {['#', 'Reg No', 'Name', 'Dept', 'Block', 'Hall', 'Bench', 'Side'].map(h => (
                      <th key={h} style={{ padding: '10px', textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSeating.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: '#999' }}>
                        No students found matching your search
                      </td>
                    </tr>
                  ) : (
                    filteredSeating.map((s, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#f5f6fa' : 'white' }}>
                        <td style={{ padding: '8px 10px' }}>{i + 1}</td>
                        <td style={{ padding: '8px 10px' }}>{s.regNo}</td>
                        <td style={{ padding: '8px 10px' }}>{s.studentName}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ background: getDeptColor(s.department), color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                            {s.department}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px' }}>{s.block}</td>
                        <td style={{ padding: '8px 10px' }}>{s.hallName}</td>
                        <td style={{ padding: '8px 10px' }}>B-{s.benchNo}</td>
                        <td style={{ padding: '8px 10px' }}>{s.side === 'L' ? 'Left' : 'Right'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}