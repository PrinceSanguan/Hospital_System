@extends('layouts.doctor')

@section('title', 'Add New Service')

@section('content')
<div class="container mx-auto py-8">
    <div class="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
        <h1 class="text-2xl font-bold mb-6">Add New Service</h1>
        <p class="text-gray-600 mb-6">Create a new service that you offer to patients</p>

        @if(session('error'))
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {{ session('error') }}
            </div>
        @endif

        <form action="{{ route('doctor.services.store') }}" method="POST" enctype="multipart/form-data">
            @csrf

            <!-- Service Name -->
            <div class="mb-4">
                <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                <input type="text" name="name" id="name" value="{{ old('name') }}" class="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="e.g. General Consultation">
                @error('name')
                    <p class="text-red-500 text-xs mt-1">{{ $message }}</p>
                @enderror
            </div>

            <!-- Service Description -->
            <div class="mb-4">
                <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" id="description" rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Describe what this service includes and what patients can expect...">{{ old('description') }}</textarea>
                @error('description')
                    <p class="text-red-500 text-xs mt-1">{{ $message }}</p>
                @enderror
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <!-- Duration -->
                <div>
                    <label for="duration_minutes" class="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                    <input type="number" name="duration_minutes" id="duration_minutes" min="5" max="240" step="5" value="{{ old('duration_minutes', 30) }}" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                    @error('duration_minutes')
                        <p class="text-red-500 text-xs mt-1">{{ $message }}</p>
                    @enderror
                </div>

                <!-- Price -->
                <div>
                    <label for="price" class="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                    <input type="number" name="price" id="price" min="0" step="0.01" value="{{ old('price') }}" class="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="0.00">
                    @error('price')
                        <p class="text-red-500 text-xs mt-1">{{ $message }}</p>
                    @enderror
                </div>
            </div>

            <!-- Service Image -->
            <div class="mb-4">
                <label for="image_path" class="block text-sm font-medium text-gray-700 mb-1">Service Image (Optional)</label>
                <input type="file" name="image_path" id="image_path" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                <p class="text-xs text-gray-500 mt-1">An image that represents this service (recommended: 800x600px)</p>
                @error('image_path')
                    <p class="text-red-500 text-xs mt-1">{{ $message }}</p>
                @enderror
            </div>

            <!-- Active Status -->
            <div class="mb-6">
                <div class="flex items-center">
                    <input type="checkbox" name="is_active" id="is_active" value="1" {{ old('is_active', true) ? 'checked' : '' }} class="h-4 w-4 text-blue-600">
                    <label for="is_active" class="ml-2 block text-sm text-gray-700">Service is active and available for booking</label>
                </div>
                <p class="text-xs text-gray-500 mt-1">When enabled, patients can see and book this service</p>
            </div>

            <div class="flex justify-end">
                <a href="{{ route('doctor.profile') }}" class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md mr-2">Cancel</a>
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md">Add Service</button>
            </div>
        </form>
    </div>
</div>
@endsection
 