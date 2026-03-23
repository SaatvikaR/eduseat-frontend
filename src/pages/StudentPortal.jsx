import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { findSeat } from '../api/eduseat';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function StudentPortal() {
  const navigate = useNavigate();
  const [regNo, setRegNo] = useState('');
  const [seat, setSeat] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const admitRef = useRef(null);

  const handleSearch = async () => {
    if (!regNo.trim()) return;
    setLoading(true);
    setError('');
    setSeat(null);
    try {
      const res = await findSeat(regNo.trim());
      setSeat(res.data);
    } catch (err) {
      setError('❌ No seat found for this register number.');
    }
    setLoading(false);
  };

  const handleDownloadPDF = async () => {
    if (!admitRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(admitRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`HallTicket_${seat.regNo}.pdf`);
    } catch (err) {
      alert('Error generating PDF');
    }
    setDownloading(false);
  };

  const totalBenches = 30;
  const benchesPerRow = 5;

  const inputStyle = {
    padding: '12px 16px', border: '1px solid #ddd',
    borderRadius: '8px', fontSize: '16px', flex: 1
  };
  const btnStyle = {
    padding: '12px 24px', background: '#1a237e', color: 'white',
    border: 'none', borderRadius: '8px', fontSize: '16px',
    cursor: 'pointer', fontWeight: 600
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa' }}>
      {/* Header */}
      <div style={{ background: '#1a237e', color: 'white', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Edu Seat | Examination Cell</h2>
        <button onClick={() => navigate('/')} style={{ padding: '8px 16px', background: '#e53935', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Logout</button>
      </div>

      <div style={{ maxWidth: '900px', margin: '32px auto', padding: '0 16px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ color: '#1a237e', marginBottom: '20px' }}>Student Seating Locator</h3>

          {/* Search */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <input
              style={inputStyle}
              placeholder="Enter Register Number"
              value={regNo}
              onChange={e => setRegNo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} style={btnStyle} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {error && (
            <div style={{ padding: '12px', background: '#ffebee', borderRadius: '8px', color: '#c62828', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          {seat && (
            <>
              {/* Download Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <button onClick={handleDownloadPDF} disabled={downloading} style={{
                  ...btnStyle, background: '#2e7d32', display: 'flex',
                  alignItems: 'center', gap: '8px', fontSize: '14px'
                }}>
                  {downloading ? 'Generating PDF...' : '⬇ Download Hall Ticket PDF'}
                </button>
              </div>

              {/* Printable Area */}
              <div ref={admitRef} style={{ background: 'white', padding: '24px', border: '1px solid #e0e0e0', borderRadius: '12px' }}>
                {/* PDF Header */}
                <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #1a237e', paddingBottom: '16px' }}>
                  <h2 style={{ color: '#1a237e', margin: 0, fontSize: '1.5rem' }}>RAJALAKSHMI INSTITUTE OF TECHNOLOGY</h2>
                  <p style={{ color: '#666', margin: '4px 0 0', fontSize: '14px' }}>Examination Cell — Hall Ticket</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                  {/* Admit Slip */}
                  <div style={{ border: '2px solid #1a237e', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ background: '#1a237e', color: 'white', padding: '12px', textAlign: 'center', fontWeight: 700, letterSpacing: '1px' }}>
                      EXAM ADMIT SLIP
                    </div>
                    {[
                      { label: 'REG NO', value: seat.regNo },
                      { label: 'NAME', value: seat.studentName },
                      { label: 'DEPT', value: seat.department },
                      { label: 'BLOCK', value: seat.block },
                      { label: 'HALL', value: seat.hallName },
                      { label: 'BENCH', value: `B-${seat.benchNo}` },
                      { label: 'SIDE', value: seat.side === 'L' ? 'Left' : 'Right', highlight: true },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #e0e0e0' }}>
                        <span style={{ color: '#1a237e', fontWeight: 600, fontSize: '13px' }}>{item.label}</span>
                        <span style={{ fontWeight: item.highlight ? 800 : 600, color: item.highlight ? '#1a237e' : '#333', fontSize: item.highlight ? '1rem' : '13px' }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Hall Map */}
                  <div>
                    <h4 style={{ color: '#1a237e', marginBottom: '12px', marginTop: 0 }}>Hall Map View: {seat.hallName}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${benchesPerRow}, 1fr)`, gap: '6px' }}>
                      {Array.from({ length: totalBenches }, (_, i) => {
                        const benchNum = i + 1;
                        const isHighlighted = benchNum === seat.benchNo;
                        return (
                          <div key={benchNum} style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '2px', marginBottom: '2px' }}>
                              <div style={{
                                flex: 1, padding: '4px 2px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                                background: isHighlighted && seat.side === 'L' ? '#1a237e' : '#e0e0e0',
                                color: isHighlighted && seat.side === 'L' ? 'white' : '#666'
                              }}>L</div>
                              <div style={{
                                flex: 1, padding: '4px 2px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                                background: isHighlighted && seat.side === 'R' ? '#1a237e' : '#e0e0e0',
                                color: isHighlighted && seat.side === 'R' ? 'white' : '#666'
                              }}>R</div>
                            </div>
                            <div style={{ fontSize: '10px', color: '#666' }}>B-{String(benchNum).padStart(2, '0')}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ marginTop: '20px', borderTop: '1px solid #e0e0e0', paddingTop: '12px', textAlign: 'center', color: '#999', fontSize: '12px' }}>
                  Generated by EduSeat — Exam Seating Management System | Rajalakshmi Institute of Technology
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

