import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Stethoscope, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface AppointmentCardProps {
  id: number;
  appointmentDate: string;
  status: string;
  details: string | null;
  doctorName?: string;
  onViewDetails?: (id: number) => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  id,
  appointmentDate,
  status,
  details,
  doctorName,
  onViewDetails
}) => {
  // Parse details from JSON string
  const parseDetails = (details: string | null) => {
    if (!details) return null;

    try {
      return JSON.parse(details);
    } catch {
      return { rawDetails: details };
    }
  };

  const parsedDetails = parseDetails(details);
  const appointmentDateTime = new Date(appointmentDate);

  // Get appropriate status badge styling
  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'completed':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="flex items-start space-x-3">
            <div className="rounded-full bg-blue-100 p-2 text-blue-600">
              <Stethoscope size={20} />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-medium">Medical Checkup</h3>
                <Badge className={getStatusBadgeClass(status)}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
              </div>

              {doctorName ? (
                <p className="text-sm text-gray-600">Dr. {doctorName}</p>
              ) : (
                <p className="text-sm text-gray-600">Pending doctor assignment</p>
              )}

              <div className="mt-2 space-y-1">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar size={14} className="mr-2" />
                  {format(appointmentDateTime, 'EEEE, MMMM d, yyyy')}
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <Clock size={14} className="mr-2" />
                  {parsedDetails?.appointment_time || format(appointmentDateTime, 'h:mm a')}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 md:mt-0">
            {parsedDetails && (
              <div className="space-y-2 text-sm">
                {parsedDetails.reason && (
                  <div>
                    <span className="font-medium">Reason:</span> {parsedDetails.reason}
                  </div>
                )}

                {parsedDetails.notes && (
                  <div>
                    <span className="font-medium">Notes:</span> {parsedDetails.notes}
                  </div>
                )}

                {parsedDetails.doctor_notes && (
                  <div>
                    <span className="font-medium">Doctor's Note:</span> {parsedDetails.doctor_notes}
                  </div>
                )}

                {parsedDetails.vital_signs && (
                  <div className="mt-2">
                    <div className="font-medium mb-1">Vital Signs:</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {parsedDetails.vital_signs.temperature && (
                        <div className="text-xs">Temperature: {parsedDetails.vital_signs.temperature}°C</div>
                      )}
                      {parsedDetails.vital_signs.pulse_rate && (
                        <div className="text-xs">Pulse: {parsedDetails.vital_signs.pulse_rate} BPM</div>
                      )}
                      {parsedDetails.vital_signs.respiratory_rate && (
                        <div className="text-xs">Respiratory: {parsedDetails.vital_signs.respiratory_rate} breaths/min</div>
                      )}
                      {parsedDetails.vital_signs.blood_pressure && (
                        <div className="text-xs">BP: {parsedDetails.vital_signs.blood_pressure} mmHg</div>
                      )}
                      {parsedDetails.vital_signs.oxygen_saturation && (
                        <div className="text-xs">O2: {parsedDetails.vital_signs.oxygen_saturation}%</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {onViewDetails && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => onViewDetails(id)}
              >
                <FileText size={14} className="mr-1" />
                View Details
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppointmentCard;
