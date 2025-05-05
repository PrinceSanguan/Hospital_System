<?php

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\URL;

class FileUploadController extends Controller
{
    /**
     * Upload medical record files.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function uploadMedicalRecords(Request $request)
    {
        try {
            Log::info('Upload attempt started', [
                'user_id' => Auth::id(),
                'request_has_files' => $request->hasFile('files'),
                'request_has_base64' => $request->has('base64_files')
            ]);

            // Method 1: Handle direct file uploads
            if ($request->hasFile('files')) {
                return $this->handleDirectFileUpload($request);
            }

            // Method 2: Handle files sent as base64 data
            if ($request->has('base64_files')) {
                return $this->handleBase64FileUpload($request);
            }

            // No files found in the request
            return response()->json([
                'success' => false,
                'message' => 'No files were found in the request.',
            ], 422);

        } catch (\Exception $e) {
            Log::error('File upload error: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'exception' => $e,
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred during file upload: ' . $e->getMessage(),
                'error_details' => env('APP_DEBUG', false) ? $e->getTrace() : null
            ], 500);
        }
    }

    /**
     * Handle direct file uploads.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    private function handleDirectFileUpload(Request $request)
    {
        $uploadedFiles = [];
        $files = $request->file('files');

        // Handle both single file and array of files
        if (!is_array($files)) {
            $files = [$files];
        }

        Log::info('Processing direct file upload', [
            'files_count' => count($files),
            'user_id' => Auth::id()
        ]);

        // Ensure the directory exists
        $uploadDir = 'medical-records/' . Auth::id();
        $fullPath = storage_path('app/public/' . $uploadDir);

        if (!file_exists($fullPath)) {
            if (!mkdir($fullPath, 0755, true)) {
                Log::error('Failed to create directory', [
                    'path' => $fullPath,
                    'user_id' => Auth::id()
                ]);
                throw new \Exception('Failed to create upload directory');
            }
            Log::info('Created directory for uploads', ['path' => $fullPath]);
        }

        foreach ($files as $file) {
            // Basic validation
            if (!$file->isValid()) {
                Log::warning('Invalid file detected', [
                    'original_name' => $file->getClientOriginalName(),
                    'error' => $file->getError()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'One or more files are invalid.',
                ], 422);
            }

            // Create a unique filename
            $filename = Str::random(40) . '.' . $file->getClientOriginalExtension();

            try {
                // Store file in the public disk for easier access
                $path = $file->storeAs(
                    $uploadDir,
                    $filename,
                    'public'
                );

                Log::info('File stored successfully', [
                    'original_name' => $file->getClientOriginalName(),
                    'path' => $path,
                    'size' => $file->getSize()
                ]);

                if (!$path) {
                    throw new \Exception('Failed to store file: ' . $file->getClientOriginalName());
                }

                // Verify the file was actually saved
                $savedFilePath = storage_path('app/public/' . $path);
                if (!file_exists($savedFilePath)) {
                    Log::error('File not found after storage', [
                        'saved_path' => $savedFilePath
                    ]);
                    throw new \Exception('File was not saved properly: ' . $file->getClientOriginalName());
                }

                // Generate URL using proper method based on configuration
                $url = url('storage/' . $path);

                $uploadedFiles[] = [
                    'name' => $file->getClientOriginalName(),
                    'path' => $path,
                    'url' => $url,
                    'size' => $file->getSize(),
                    'type' => $file->getMimeType(),
                ];
            } catch (\Exception $e) {
                Log::error('Error storing file', [
                    'original_name' => $file->getClientOriginalName(),
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);

                throw $e;
            }
        }

        Log::info('File upload completed successfully', [
            'files_count' => count($uploadedFiles)
        ]);

        return response()->json([
            'success' => true,
            'files' => $uploadedFiles,
            'message' => 'Files uploaded successfully.',
        ]);
    }

    /**
     * Handle base64 encoded file uploads.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    private function handleBase64FileUpload(Request $request)
    {
        $uploadedFiles = [];
        $base64Files = $request->input('base64_files');

        if (!is_array($base64Files)) {
            $base64Files = [$base64Files];
        }

        Log::info('Processing base64 file upload', [
            'files_count' => count($base64Files),
            'user_id' => Auth::id()
        ]);

        // Ensure the directory exists
        $uploadDir = 'medical-records/' . Auth::id();
        $fullPath = storage_path('app/public/' . $uploadDir);

        if (!file_exists($fullPath)) {
            if (!mkdir($fullPath, 0755, true)) {
                Log::error('Failed to create directory', [
                    'path' => $fullPath,
                    'user_id' => Auth::id()
                ]);
                throw new \Exception('Failed to create upload directory');
            }
            Log::info('Created directory for uploads', ['path' => $fullPath]);
        }

        foreach ($base64Files as $fileData) {
            // Extract base64 data and file info
            $matches = [];
            if (preg_match('/^data:(.+);base64,(.+)$/', $fileData['data'], $matches)) {
                $mimeType = $matches[1];
                $base64Data = $matches[2];
                $decodedData = base64_decode($base64Data);

                if ($decodedData === false) {
                    Log::error('Failed to decode base64 data', [
                        'user_id' => Auth::id(),
                        'mime_type' => $mimeType
                    ]);
                    throw new \Exception('Invalid base64 data');
                }

                // Get extension from mime type
                $extensions = [
                    'image/jpeg' => 'jpg',
                    'image/png' => 'png',
                    'application/pdf' => 'pdf',
                    'application/msword' => 'doc',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
                ];

                $extension = $extensions[$mimeType] ?? 'bin';
                $filename = Str::random(40) . '.' . $extension;

                // Store the decoded file
                $path = $uploadDir . '/' . $filename;

                try {
                    $saved = Storage::disk('public')->put($path, $decodedData);

                    if (!$saved) {
                        Log::error('Failed to store base64 file', [
                            'path' => $path,
                            'user_id' => Auth::id()
                        ]);
                        throw new \Exception('Failed to store base64 file');
                    }

                    // Verify the file was actually saved
                    $savedFilePath = storage_path('app/public/' . $path);
                    if (!file_exists($savedFilePath)) {
                        Log::error('File not found after storage', [
                            'saved_path' => $savedFilePath
                        ]);
                        throw new \Exception('File was not saved properly');
                    }

                    Log::info('Base64 file stored successfully', [
                        'path' => $path,
                        'size' => strlen($decodedData),
                        'mime_type' => $mimeType
                    ]);

                    // Generate URL using proper method based on configuration
                    $url = url('storage/' . $path);

                    $uploadedFiles[] = [
                        'name' => $fileData['name'] ?? $filename,
                        'path' => $path,
                        'url' => $url,
                        'size' => strlen($decodedData),
                        'type' => $mimeType,
                    ];
                } catch (\Exception $e) {
                    Log::error('Error storing base64 file', [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    throw $e;
                }
            } else {
                Log::warning('Invalid base64 data format', [
                    'user_id' => Auth::id()
                ]);
            }
        }

        Log::info('Base64 file upload completed successfully', [
            'files_count' => count($uploadedFiles)
        ]);

        return response()->json([
            'success' => true,
            'files' => $uploadedFiles,
            'message' => 'Base64 files uploaded successfully.',
        ]);
    }
}
