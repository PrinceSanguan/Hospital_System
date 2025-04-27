import { Link } from "@inertiajs/react";
import { motion } from "framer-motion";
import { LucideIcon, Microscope, Stethoscope, Calendar, ClipboardList, UserRound, UserCog, Clock, MapPin, Phone, Mail, ChevronRight } from "lucide-react";
import { PageProps } from "@/types";
import { Button } from "@/components/ui/button";

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  requires_auth: boolean;
}

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  image: string;
  availability: string[];
}

interface ScheduleDay {
  day: string;
  slots: {
    time: string;
    available: boolean;
  }[];
}

interface LandingProps {
  services: Service[];
  isAuthenticated: boolean;
  userRole: string | null;
  doctors?: Doctor[];
  schedule?: ScheduleDay[];
}

// Map service icons to Lucide icons
const iconMap: Record<string, LucideIcon> = {
  medical: Stethoscope,
  laboratory: Microscope,
  schedule: Calendar,
  services: ClipboardList,
  doctor: UserRound,
  specialist: UserCog,
};

// Sample doctors data - in a real app, this would come from the backend
const sampleDoctors: Doctor[] = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    specialty: "Cardiologist",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
    availability: ["Monday", "Wednesday", "Friday"]
  },
  {
    id: 2,
    name: "Dr. Michael Chen",
    specialty: "Neurologist",
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
    availability: ["Tuesday", "Thursday", "Saturday"]
  },
  {
    id: 3,
    name: "Dr. Emily Williams",
    specialty: "Pediatrician",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
    availability: ["Monday", "Tuesday", "Friday"]
  },
  {
    id: 4,
    name: "Dr. James Rodriguez",
    specialty: "Orthopedic Surgeon",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
    availability: ["Wednesday", "Thursday", "Saturday"]
  }
];

// Sample schedule data - in a real app, this would come from the backend
const sampleSchedule: ScheduleDay[] = [
  {
    day: "Monday",
    slots: [
      { time: "09:00 AM", available: true },
      { time: "10:00 AM", available: false },
      { time: "11:00 AM", available: true },
      { time: "01:00 PM", available: true },
      { time: "02:00 PM", available: false },
      { time: "03:00 PM", available: true },
    ]
  },
  {
    day: "Tuesday",
    slots: [
      { time: "09:00 AM", available: false },
      { time: "10:00 AM", available: true },
      { time: "11:00 AM", available: true },
      { time: "01:00 PM", available: false },
      { time: "02:00 PM", available: true },
      { time: "03:00 PM", available: true },
    ]
  },
  {
    day: "Wednesday",
    slots: [
      { time: "09:00 AM", available: true },
      { time: "10:00 AM", available: true },
      { time: "11:00 AM", available: false },
      { time: "01:00 PM", available: true },
      { time: "02:00 PM", available: false },
      { time: "03:00 PM", available: true },
    ]
  }
];

export default function Landing({ services, isAuthenticated, userRole, doctors = sampleDoctors, schedule = sampleSchedule }: PageProps<LandingProps>) {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link href="/" className="flex items-center">
                  <Stethoscope className="h-8 w-8 text-blue-600" />
                  <span className="ml-2 text-xl font-bold text-blue-800">FarmCare</span>
                </Link>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-6">
                  <Link href="#services" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600">Services</Link>
                  <Link href="#doctors" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600">Doctors</Link>
                  <Link href="#schedule" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600">Schedule</Link>
                  <Link href="#about" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600">About</Link>
                  <Link href="#contact" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600">Contact</Link>
                </div>
              </div>
            </div>
            <div>
              {!isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={route('auth.login')}>Login</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href={route('auth.register')}>Register</Link>
                  </Button>
                </div>
              ) : (
                <Button asChild size="sm">
                  <Link href={route('dashboard')}>Dashboard</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-16 text-white">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80"
            alt="Hospital Building"
            className="w-full h-full object-cover brightness-50"
          />
        </div>

        <div className="container relative z-10 mx-auto px-6 py-28 md:py-40">
          <div className="max-w-xl">
            <motion.h1
              className="mb-6 text-4xl font-bold md:text-5xl lg:text-6xl"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Quality Healthcare for Everyone
            </motion.h1>
            <motion.p
              className="mb-10 text-lg text-gray-100 md:text-xl"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              FarmCare Clinic and Laboratory provides comprehensive healthcare services with state-of-the-art facilities and experienced professionals.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {!isAuthenticated ? (
                <div className="flex flex-col justify-start space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
                  <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                    <Link href={route('auth.register')}>Register Now</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-white text-blue-700 hover:bg-white hover:text-blue-600">
                    <Link href="#services">Our Services</Link>
                  </Button>
                </div>
              ) : (
                <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                  <Link href={route('dashboard')}>Go to Dashboard</Link>
                </Button>
              )}
            </motion.div>
          </div>
        </div>
      </header>

      {/* Services Section */}
      <section id="services" className="py-20">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Our Services</h2>
            <p className="mx-auto max-w-2xl text-gray-600">We provide a wide range of medical services to meet all your healthcare needs</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => {
              const Icon = iconMap[service.icon] || ClipboardList;
              return (
                <motion.div
                  key={service.id}
                  className="rounded-lg bg-white p-6 shadow-lg transition-all hover:shadow-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <Icon size={28} />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-gray-800">{service.title}</h3>
                  <p className="mb-4 text-gray-600">{service.description}</p>
                  {service.requires_auth && !isAuthenticated ? (
                    <Button asChild variant="outline" size="sm" className="mt-2">
                      <Link href={route('auth.register')}>Register to Access</Link>
                    </Button>
                  ) : (
                    <Button asChild variant="outline" size="sm" className="mt-2">
                      <Link href={route('service.view', service.id)} className="flex items-center">
                        View Details <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Doctors Section */}
      <section id="doctors" className="bg-blue-50 py-20">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Our Specialists</h2>
            <p className="mx-auto max-w-2xl text-gray-600">Meet our team of experienced doctors and specialists</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {doctors.map((doctor, index) => (
              <motion.div
                key={doctor.id}
                className="overflow-hidden rounded-lg bg-white shadow-lg"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="aspect-w-3 aspect-h-4 w-full">
                  <img
                    src={doctor.image}
                    alt={doctor.name}
                    className="h-64 w-full object-cover object-center"
                  />
                </div>
                <div className="p-6">
                  <h3 className="mb-1 text-xl font-semibold text-gray-900">{doctor.name}</h3>
                  <p className="mb-3 text-blue-600">{doctor.specialty}</p>
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700">Available on:</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {doctor.availability.map(day => (
                        <span key={day} className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={`/service/appointment?doctor=${doctor.id}`}>Book Appointment</Link>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section id="schedule" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Clinical Schedule</h2>
            <p className="mx-auto max-w-2xl text-gray-600">Check our availability and book your appointment</p>
          </div>

          <div className="mx-auto max-w-6xl">
            {/* Calendar View */}
            <div className="mb-8 overflow-hidden rounded-lg border shadow-lg bg-white">
              <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-center">
                <h3 className="font-semibold text-lg text-gray-900 mb-2 sm:mb-0">July 2024</h3>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    Previous
                  </Button>
                  <Button variant="outline" size="sm">
                    Today
                  </Button>
                  <Button variant="outline" size="sm">
                    Next
                  </Button>
                </div>
              </div>

              {/* Days of Week Header */}
              <div className="grid grid-cols-7 border-b">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center font-medium text-sm text-gray-700">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days Grid */}
              <div className="grid grid-cols-7">
                {/* First week with empty days */}
                <div className="border-r border-b min-h-[90px] p-1 bg-gray-50"></div>
                <div className="border-r border-b min-h-[90px] p-1 bg-gray-50"></div>
                <div className="border-r border-b min-h-[90px] p-1">
                  <div className="text-sm p-1 font-medium">1</div>
                  <div className="mt-1">
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                      Available
                    </span>
                  </div>
                </div>
                <div className="border-r border-b min-h-[90px] p-1">
                  <div className="text-sm p-1 font-medium">2</div>
                  <div className="mt-1">
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                      Available
                    </span>
                  </div>
                </div>
                <div className="border-r border-b min-h-[90px] p-1">
                  <div className="text-sm p-1 font-medium">3</div>
                  <div className="mt-1">
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-red-100 text-red-800">
                      Booked
                    </span>
                  </div>
                </div>
                <div className="border-r border-b min-h-[90px] p-1">
                  <div className="text-sm p-1 font-medium">4</div>
                  <div className="mt-1">
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                      Available
                    </span>
                  </div>
                </div>
                <div className="border-b min-h-[90px] p-1">
                  <div className="text-sm p-1 font-medium">5</div>
                  <div className="mt-1">
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                      Available
                    </span>
                  </div>
                </div>

                {/* Second week */}
                <div className="border-r border-b min-h-[90px] p-1">
                  <div className="text-sm p-1 font-medium">6</div>
                  <div className="mt-1">
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-red-100 text-red-800">
                      Booked
                    </span>
                  </div>
                </div>
                <div className="border-r border-b min-h-[90px] p-1">
                  <div className="text-sm p-1 font-medium">7</div>
                  <div className="mt-1">
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                      Available
                    </span>
                  </div>
                  <div className="mt-1">
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800">
                      Dr. Johnson
                    </span>
                  </div>
                </div>
                <div className="border-r border-b min-h-[90px] p-1">
                  <div className="text-sm p-1 font-medium">8</div>
                  <div className="mt-1">
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                      Available
                    </span>
                  </div>
                  <div className="mt-1">
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800">
                      Dr. Chen
                    </span>
                  </div>
                </div>
                <div className="border-r border-b min-h-[90px] p-1">
                  <div className="text-sm p-1 font-medium">9</div>
                  <div className="mt-1">
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                      Available
                    </span>
                  </div>
                </div>
                <div className="border-r border-b min-h-[90px] p-1 bg-blue-50">
                  <div className="text-sm p-1 font-medium text-blue-800">10</div>
                  <div className="mt-1">
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                      Available
                    </span>
                  </div>
                  <div className="mt-1">
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800">
                      Dr. Williams
                    </span>
                  </div>
                </div>
                <div className="border-r border-b min-h-[90px] p-1">
                  <div className="text-sm p-1 font-medium">11</div>
                  <div className="mt-1">
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-red-100 text-red-800">
                      Booked
                    </span>
                  </div>
                </div>
                <div className="border-b min-h-[90px] p-1">
                  <div className="text-sm p-1 font-medium">12</div>
                  <div className="mt-1">
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                      Available
                    </span>
                  </div>
                </div>

                {/* Third week */}
                <div className="border-r border-b min-h-[90px] p-1">
                  <div className="text-sm p-1 font-medium">13</div>
                  <div className="mt-1">
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                      Available
                    </span>
                  </div>
                </div>
                <div className="border-r border-b min-h-[90px] p-1">
                  <div className="text-sm p-1 font-medium">14</div>
                  <div className="mt-1">
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-red-100 text-red-800">
                      Booked
                    </span>
                  </div>
                </div>
                <div className="border-r border-b min-h-[90px] p-1">
                  <div className="text-sm p-1 font-medium">15</div>
                  <div className="mt-1">
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                      Available
                    </span>
                  </div>
                  <div className="mt-1">
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800">
                      Dr. Johnson
                    </span>
                  </div>
                </div>
                <div className="border-r border-b min-h-[90px] p-1">
                  <div className="text-sm p-1 font-medium">16</div>
                  <div className="mt-1">
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                      Available
                    </span>
                  </div>
                </div>
                <div className="border-r border-b min-h-[90px] p-1">
                  <div className="text-sm p-1 font-medium">17</div>
                  <div className="mt-1">
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                      Available
                    </span>
                  </div>
                </div>
                <div className="border-r border-b min-h-[90px] p-1">
                  <div className="text-sm p-1 font-medium">18</div>
                  <div className="mt-1">
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-red-100 text-red-800">
                      Booked
                    </span>
                  </div>
                </div>
                <div className="border-b min-h-[90px] p-1">
                  <div className="text-sm p-1 font-medium">19</div>
                  <div className="mt-1">
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                      Available
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Available Doctors */}
            <div className="mb-8">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Available Doctors This Week</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {doctors.map((doctor) => (
                  <div key={doctor.id} className="p-4 border rounded-lg shadow-sm bg-white flex items-center space-x-3">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden">
                      <img src={doctor.image} alt={doctor.name} className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{doctor.name}</p>
                      <p className="text-sm text-gray-500">{doctor.specialty}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Schedule */}
            <div className="overflow-hidden rounded-lg border shadow-lg bg-white">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-lg text-gray-900">Daily Schedules</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x">
                {schedule.map((day) => (
                  <div key={day.day} className="p-6">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">{day.day}</h3>
                    <div className="space-y-3">
                      {day.slots.map(slot => (
                        <div key={slot.time} className="flex items-center justify-between">
                          <span className="flex items-center text-sm text-gray-700">
                            <Clock className="mr-2 h-4 w-4 text-gray-400" />
                            {slot.time}
                          </span>
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                            slot.available
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {slot.available ? 'Available' : 'Booked'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Book an Appointment
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-blue-800 py-20 text-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-between gap-12 md:flex-row">
            <div className="md:w-1/2">
              <h2 className="mb-6 text-3xl font-bold">About FarmCare Clinic</h2>
              <p className="mb-4">
                FarmCare Clinic and Laboratory is dedicated to providing comprehensive healthcare services to our community.
                With state-of-the-art facilities and experienced healthcare professionals, we are committed to delivering
                the highest quality of care to our patients.
              </p>
              <p>
                Our integrated clinical and laboratory management system ensures efficient patient care, accurate diagnostics,
                and seamless coordination between different departments.
              </p>
            </div>
            <div className="md:w-1/2">
              <div className="rounded-lg bg-blue-700 p-8 shadow-lg">
                <h3 className="mb-4 text-xl font-semibold">Why Choose Us?</h3>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">✓</span>
                    Qualified healthcare professionals
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">✓</span>
                    Modern diagnostic equipment
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">✓</span>
                    Efficient appointment system
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">✓</span>
                    Secure patient records
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">✓</span>
                    Comprehensive healthcare services
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Contact Us</h2>
            <p className="mx-auto max-w-2xl text-gray-600">We're here to help you with any questions or concerns</p>
          </div>

          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow-lg">
              <h3 className="mb-6 text-xl font-semibold text-gray-900">Get in Touch</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <MapPin className="mr-3 h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Our Location</p>
                    <p className="text-gray-600">123 Healthcare Avenue, Medical District, City</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="mr-3 h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Phone Number</p>
                    <p className="text-gray-600">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Mail className="mr-3 h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Email Address</p>
                    <p className="text-gray-600">info@farmcare.com</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="mr-3 h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Working Hours</p>
                    <p className="text-gray-600">Monday to Saturday: 8:00 AM - 6:00 PM</p>
                    <p className="text-gray-600">Sunday: Emergency Services Only</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-lg">
              <h3 className="mb-6 text-xl font-semibold text-gray-900">Send us a Message</h3>
              <form className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input type="text" id="name" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                  <input type="email" id="email" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                  <textarea id="message" rows={4} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"></textarea>
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Send Message</Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-900 py-12 text-white">
        <div className="container mx-auto px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center">
                <Stethoscope className="h-8 w-8 text-blue-300" />
                <span className="ml-2 text-xl font-bold">FarmCare</span>
              </div>
              <p className="mb-4 text-blue-200">Providing quality healthcare services to our community since 2010.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-blue-300 hover:text-white">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm3 8h-1.35c-.538 0-.65.221-.65.778v1.222h2l-.209 2h-1.791v7h-3v-7h-2v-2h2v-2.308c0-1.769.931-2.692 3.029-2.692h1.971v3z" /></svg>
                </a>
                <a href="#" className="text-blue-300 hover:text-white">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6.066 9.645c.183 4.04-2.83 8.544-8.164 8.544-1.622 0-3.131-.476-4.402-1.291 1.524.18 3.045-.244 4.252-1.189-1.256-.023-2.317-.854-2.684-1.995.451.086.895.061 1.298-.049-1.381-.278-2.335-1.522-2.304-2.853.388.215.83.344 1.301.359-1.279-.855-1.641-2.544-.889-3.835 1.416 1.738 3.533 2.881 5.92 3.001-.419-1.796.944-3.527 2.799-3.527.825 0 1.572.349 2.096.907.654-.128 1.27-.368 1.824-.697-.215.671-.67 1.233-1.263 1.589.581-.07 1.135-.224 1.649-.453-.384.578-.87 1.084-1.433 1.489z" /></svg>
                </a>
                <a href="#" className="text-blue-300 hover:text-white">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 16h-2v-6h2v6zm-1-6.891c-.607 0-1.1-.496-1.1-1.109 0-.612.492-1.109 1.1-1.109s1.1.497 1.1 1.109c0 .613-.493 1.109-1.1 1.109zm8 6.891h-1.998v-2.861c0-1.881-2.002-1.722-2.002 0v2.861h-2v-6h2v1.093c.872-1.616 4-1.736 4 1.548v3.359z" /></svg>
                </a>
                <a href="#" className="text-blue-300 hover:text-white">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6 5.792c-1.857 1.94-6.423 6.76-6.423 6.76l4.423-1.636v7.221h-2l-3-5.172-1.5 5.172h-2v-11.345h2l3 5.172 1.5-5.172h2v3.345l3.423-3.439h-1.423l-4.423 4.439 5.423-6.345h2v1h-2z" /></svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/" className="text-blue-200 hover:text-white">Home</Link></li>
                <li><Link href="#services" className="text-blue-200 hover:text-white">Services</Link></li>
                <li><Link href="#doctors" className="text-blue-200 hover:text-white">Doctors</Link></li>
                <li><Link href="#schedule" className="text-blue-200 hover:text-white">Schedule</Link></li>
                <li><Link href="#about" className="text-blue-200 hover:text-white">About Us</Link></li>
                <li><Link href="#contact" className="text-blue-200 hover:text-white">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold">Our Services</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-blue-200 hover:text-white">General Checkup</a></li>
                <li><a href="#" className="text-blue-200 hover:text-white">Specialist Consultation</a></li>
                <li><a href="#" className="text-blue-200 hover:text-white">Laboratory Tests</a></li>
                <li><a href="#" className="text-blue-200 hover:text-white">Vaccination</a></li>
                <li><a href="#" className="text-blue-200 hover:text-white">Emergency Care</a></li>
                <li><a href="#" className="text-blue-200 hover:text-white">Telemedicine</a></li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold">Newsletter</h3>
              <p className="mb-4 text-blue-200">Subscribe to our newsletter for health tips and updates.</p>
              <form className="mb-4 flex">
                <input type="email" placeholder="Your email" className="w-full rounded-l-md border-0 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="submit" className="rounded-r-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          <div className="mt-8 border-t border-blue-800 pt-8 text-center text-blue-300">
            <p>© {new Date().getFullYear()} FarmCare Clinic and Laboratory. All rights reserved.</p>
            <div className="mt-2 flex justify-center space-x-4">
              <a href="#" className="text-blue-300 hover:text-white">Privacy Policy</a>
              <a href="#" className="text-blue-300 hover:text-white">Terms of Service</a>
              <a href="#" className="text-blue-300 hover:text-white">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
