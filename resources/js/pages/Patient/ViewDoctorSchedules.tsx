import React, { useState, useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { Card, Table, Alert, Row, Col, Badge } from 'react-bootstrap';
import { PatientLayout } from '@/layouts/PatientLayout';
import axios from 'axios';

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  profile_image: string;
}

interface Schedule {
  id: number;
  doctor_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  specific_date: string | null;
  is_available: boolean;
  is_approved: boolean;
  status: string;
  doctor?: Doctor;
}

interface Props {
  doctors: Doctor[];
  flash: {
    success?: string;
    error?: string;
  };
  user: {
    name: string;
    email: string;
    role: string;
  };
}

const ViewDoctorSchedules: React.FC = () => {
  const { doctors, flash, user } = usePage<Props>().props;
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<string>('week');

  // Filter for a specific date or just get the upcoming week
  const fetchSchedules = async (doctorId: number) => {
    setLoading(true);
    setError(null);

    try {
      let url = `/api/doctor-schedules/${doctorId}`;
      if (selectedDate) {
        url += `?date=${selectedDate}`;
      }

      const response = await axios.get(url);
      setSchedules(response.data.schedules);
    } catch (err) {
      setError('Failed to load doctor schedules. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDoctor) {
      fetchSchedules(selectedDoctor);
    }
  }, [selectedDoctor, selectedDate]);

  const handleDoctorSelect = (doctorId: number) => {
    setSelectedDoctor(doctorId);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const formatTime = (time: string) => {
    return time ? new Date(`2000-01-01T${time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';
  };

  const getDayName = (day: string) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[parseInt(day)] || day;
  };

  // Group schedules by date/day for the weekly view
  const groupedSchedules = schedules.reduce((acc, schedule) => {
    const day = schedule.specific_date
      ? new Date(schedule.specific_date).toLocaleDateString()
      : getDayName(schedule.day_of_week);

    if (!acc[day]) {
      acc[day] = [];
    }

    acc[day].push(schedule);
    return acc;
  }, {} as Record<string, Schedule[]>);

  return (
    <PatientLayout user={user}>
      <Head title="Doctor Schedules" />

      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3">Doctor Schedules</h1>
        </div>

        {flash.success && (
          <Alert variant="success" className="mb-4">
            {flash.success}
          </Alert>
        )}

        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}

        <Row className="mb-4">
          <Col md={3}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Our Doctors</h5>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="list-group list-group-flush">
                  {doctors.map(doctor => (
                    <button
                      key={doctor.id}
                      className={`list-group-item list-group-item-action d-flex align-items-center ${selectedDoctor === doctor.id ? 'active' : ''}`}
                      onClick={() => handleDoctorSelect(doctor.id)}
                    >
                      {doctor.profile_image && (
                        <img
                          src={doctor.profile_image}
                          alt={doctor.name}
                          className="rounded-circle me-2"
                          style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                        />
                      )}
                      <div>
                        <div className="fw-bold">{doctor.name}</div>
                        <small>{doctor.specialty}</small>
                      </div>
                    </button>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={9}>
            {selectedDoctor ? (
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    {doctors.find(d => d.id === selectedDoctor)?.name}'s Schedule
                  </h5>
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      <select
                        className="form-select"
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value)}
                      >
                        <option value="week">Weekly View</option>
                        <option value="day">Daily View</option>
                      </select>
                    </div>
                    <input
                      type="date"
                      className="form-control"
                      value={selectedDate || ''}
                      onChange={handleDateChange}
                    />
                  </div>
                </Card.Header>
                <Card.Body>
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2">Loading schedules...</p>
                    </div>
                  ) : (
                    <>
                      {schedules.length === 0 ? (
                        <Alert variant="info">
                          No schedules found for this doctor. Please try another date or contact the clinic.
                        </Alert>
                      ) : (
                        viewMode === 'week' ? (
                          <div>
                            {Object.keys(groupedSchedules).map(day => (
                              <div key={day} className="mb-4">
                                <h5 className="mb-3">{day}</h5>
                                <Table striped bordered hover responsive>
                                  <thead>
                                    <tr>
                                      <th>Time</th>
                                      <th>Status</th>
                                      <th>Book</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {groupedSchedules[day].map(schedule => (
                                      <tr key={schedule.id}>
                                        <td>{formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}</td>
                                        <td>
                                          {schedule.is_available && schedule.is_approved ? (
                                            <Badge bg="success">Available</Badge>
                                          ) : (
                                            <Badge bg="danger">Unavailable</Badge>
                                          )}
                                        </td>
                                        <td>
                                          {schedule.is_available && schedule.is_approved ? (
                                            <Link
                                              href={route('patient.appointments.book', { scheduleId: schedule.id })}
                                              className="btn btn-primary btn-sm"
                                            >
                                              Book Appointment
                                            </Link>
                                          ) : (
                                            <span className="text-muted">Not Available</span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </Table>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <Table striped bordered hover responsive>
                            <thead>
                              <tr>
                                <th>Day/Date</th>
                                <th>Time</th>
                                <th>Status</th>
                                <th>Book</th>
                              </tr>
                            </thead>
                            <tbody>
                              {schedules.map(schedule => (
                                <tr key={schedule.id}>
                                  <td>
                                    {schedule.specific_date
                                      ? new Date(schedule.specific_date).toLocaleDateString()
                                      : getDayName(schedule.day_of_week)}
                                  </td>
                                  <td>{formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}</td>
                                  <td>
                                    {schedule.is_available && schedule.is_approved ? (
                                      <Badge bg="success">Available</Badge>
                                    ) : (
                                      <Badge bg="danger">Unavailable</Badge>
                                    )}
                                  </td>
                                  <td>
                                    {schedule.is_available && schedule.is_approved ? (
                                      <Link
                                        href={route('patient.appointments.book', { scheduleId: schedule.id })}
                                        className="btn btn-primary btn-sm"
                                      >
                                        Book Appointment
                                      </Link>
                                    ) : (
                                      <span className="text-muted">Not Available</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        )
                      )}
                    </>
                  )}
                </Card.Body>
              </Card>
            ) : (
              <Card className="h-100 d-flex align-items-center justify-content-center">
                <Card.Body className="text-center">
                  <h4>Select a Doctor</h4>
                  <p className="text-muted">Please select a doctor from the list to view their schedule.</p>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </div>
    </PatientLayout>
  );
};

export default ViewDoctorSchedules;
