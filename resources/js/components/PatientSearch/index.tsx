import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import debounce from 'lodash/debounce';

interface Patient {
  id: number;
  name: string;
  reference_number: string;
}

interface PatientSearchProps {
  onSelect: (patient: Patient) => void;
  label?: string;
  className?: string;
  placeholder?: string;
  required?: boolean;
}

export default function PatientSearch({
  onSelect,
  label = 'Search Patient (Name or Reference #)',
  className = '',
  placeholder = 'Enter patient name or reference number',
  required = false
}: PatientSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use direct URL instead of route()
  const TEST_SEARCH_URL = '/test-patient-search';

  // Debounced search function
  const searchPatients = debounce(async (term: string) => {
    if (term.length > 2) {
      setIsLoading(true);
      setError(null);
      try {
        console.log('Searching patients with term:', term);

        // Try our test endpoint first
        const response = await axios.get(TEST_SEARCH_URL, {
          params: { term }
        });

        console.log('Search response:', response.data);

        if (response.data.match_type === 'exact') {
          // We have an exact match
          handlePatientSelect(response.data.patient);
        } else if (response.data.patients && response.data.patients.length > 0) {
          // We have search results
          setSearchResults(response.data.patients);
        } else {
          // No results
          setSearchResults([]);
          setError('No matching patients found');
        }
      } catch (error) {
        console.error('Error searching patients:', error);
        setSearchResults([]);
        setError('Error searching for patients');
      } finally {
        setIsLoading(false);
      }
    } else {
      setSearchResults([]);
    }
  }, 300);

  useEffect(() => {
    searchPatients(searchTerm);

    // If the search term looks like a reference number pattern, do an exact search
    if (/^PAT\d{6}$/i.test(searchTerm)) {
      // This is likely a patient reference number, search for exact match
      setVerifying(true);
      setError(null);
      const exactSearch = async () => {
        setIsLoading(true);
        try {
          // Use our test endpoint
          console.log('Doing exact reference number search for:', searchTerm);
          const response = await axios.get(TEST_SEARCH_URL, {
            params: {
              term: searchTerm
            }
          });

          console.log('Exact search response:', response.data);

          if (response.data.match_type === 'exact') {
            handlePatientSelect(response.data.patient);
          } else {
            setVerifying(false);
            setError('No patient with this reference number');
          }
        } catch (error) {
          console.error('Error searching for exact patient match:', error);
          setVerifying(false);
          setError('Error checking reference number');
        } finally {
          setIsLoading(false);
        }
      };

      exactSearch();
    } else if (selectedPatient && searchTerm !== selectedPatient.reference_number) {
      // Clear selected patient if search term changed
      setSelectedPatient(null);
      setVerifying(false);
      setError(null);
    }
  }, [searchTerm]);

  const handlePatientSelect = (patient: Patient) => {
    console.log('Patient selected:', patient);
    setSelectedPatient(patient);
    setSearchTerm(patient.reference_number);
    setSearchResults([]);
    setVerifying(false);
    setError(null);
    onSelect(patient);
  };

  return (
    <div className={`space-y-2 relative ${className}`}>
      <Label htmlFor="patient_search" className="text-gray-700 font-medium text-sm">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      <div className="relative">
        <Input
          id="patient_search"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="w-full py-2 transition-all"
        />

        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        )}

        {/* Immediate reference number feedback */}
        {/^PAT\d{6}$/i.test(searchTerm) && !selectedPatient && !isLoading && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2 text-sm">
            {verifying ? (
              <span className="text-blue-500">Verifying...</span>
            ) : (
              <span className="text-red-500">{error || 'No matching patient'}</span>
            )}
          </div>
        )}

        {/* Show patient name when reference number matches */}
        {selectedPatient && searchTerm === selectedPatient.reference_number && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2 text-sm">
            <span className="text-green-600 font-medium">✓ {selectedPatient.name}</span>
          </div>
        )}
      </div>

      {/* Dropdown results */}
      {searchResults.length > 0 && !selectedPatient && (
        <div className="absolute z-50 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-auto mt-1">
          {searchResults.map((patient) => (
            <div
              key={patient.id}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handlePatientSelect(patient)}
            >
              <div className="font-medium">{patient.name}</div>
              <div className="text-sm text-gray-600">
                Ref #: {patient.reference_number}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected patient display */}
      {selectedPatient && (
        <div className="p-2 bg-gray-50 rounded-md border border-gray-200 mt-1">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-green-600">Patient Verified ✓</p>
            </div>
            <button
              type="button"
              className="text-gray-500 hover:text-gray-700"
              onClick={() => {
                setSelectedPatient(null);
                setSearchTerm('');
                setError(null);
                onSelect({} as Patient);
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
