<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title') - Doctor Dashboard</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Custom styles -->
    <style>
        .sidebar-link.active {
            background-color: #EBF5FF;
            color: #3B82F6;
            font-weight: 500;
        }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="flex h-screen overflow-hidden">
        <!-- Sidebar -->
        <aside class="hidden md:flex md:flex-shrink-0">
            <div class="flex flex-col w-64 border-r bg-white">
                <div class="flex items-center justify-center h-16 border-b">
                    <h1 class="text-xl font-semibold text-blue-600">Doctor Dashboard</h1>
                </div>
                <div class="overflow-y-auto flex-grow">
                    <nav class="mt-5 px-2">
                        <a href="{{ route('doctor.dashboard') }}" class="sidebar-link group flex items-center px-2 py-2 text-base font-medium rounded-md {{ request()->routeIs('doctor.dashboard') ? 'active' : 'text-gray-600 hover:bg-gray-100' }}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="mr-3 h-5 w-5 {{ request()->routeIs('doctor.dashboard') ? 'text-blue-500' : 'text-gray-500' }}" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                            </svg>
                            Dashboard
                        </a>

                        <a href="{{ route('doctor.profile') }}" class="sidebar-link group flex items-center px-2 py-2 text-base font-medium rounded-md {{ request()->routeIs('doctor.profile') ? 'active' : 'text-gray-600 hover:bg-gray-100' }}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="mr-3 h-5 w-5 {{ request()->routeIs('doctor.profile') ? 'text-blue-500' : 'text-gray-500' }}" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                            </svg>
                            My Profile
                        </a>

                        <a href="{{ route('doctor.services.manage') }}" class="sidebar-link group flex items-center px-2 py-2 text-base font-medium rounded-md {{ request()->routeIs('doctor.services.*') ? 'active' : 'text-gray-600 hover:bg-gray-100' }}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="mr-3 h-5 w-5 {{ request()->routeIs('doctor.services.*') ? 'text-blue-500' : 'text-gray-500' }}" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v6a1 1 0 102 0V8z" clip-rule="evenodd" />
                            </svg>
                            My Services
                        </a>

                        <a href="{{ route('doctor.schedule.index') }}" class="sidebar-link group flex items-center px-2 py-2 text-base font-medium rounded-md {{ request()->routeIs('doctor.schedule.*') ? 'active' : 'text-gray-600 hover:bg-gray-100' }}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="mr-3 h-5 w-5 {{ request()->routeIs('doctor.schedule.*') ? 'text-blue-500' : 'text-gray-500' }}" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                            </svg>
                            My Schedule
                        </a>

                        <a href="{{ route('doctor.appointments.index') }}" class="sidebar-link group flex items-center px-2 py-2 text-base font-medium rounded-md {{ request()->routeIs('doctor.appointments.*') ? 'active' : 'text-gray-600 hover:bg-gray-100' }}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="mr-3 h-5 w-5 {{ request()->routeIs('doctor.appointments.*') ? 'text-blue-500' : 'text-gray-500' }}" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                            </svg>
                            Appointments
                        </a>

                        <a href="{{ route('doctor.patients.index') }}" class="sidebar-link group flex items-center px-2 py-2 text-base font-medium rounded-md {{ request()->routeIs('doctor.patients.*') ? 'active' : 'text-gray-600 hover:bg-gray-100' }}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="mr-3 h-5 w-5 {{ request()->routeIs('doctor.patients.*') ? 'text-blue-500' : 'text-gray-500' }}" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                            </svg>
                            My Patients
                        </a>

                        <a href="{{ route('doctor.records.index') }}" class="sidebar-link group flex items-center px-2 py-2 text-base font-medium rounded-md {{ request()->routeIs('doctor.records.*') ? 'active' : 'text-gray-600 hover:bg-gray-100' }}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="mr-3 h-5 w-5 {{ request()->routeIs('doctor.records.*') ? 'text-blue-500' : 'text-gray-500' }}" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" />
                            </svg>
                            Medical Records
                        </a>
                    </nav>
                </div>
                <div class="flex-shrink-0 border-t p-4">
                    <form method="POST" action="{{ route('auth.logout') }}">
                        @csrf
                        <button type="submit" class="flex items-center text-red-500 hover:text-red-700">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd" />
                            </svg>
                            Logout
                        </button>
                    </form>
                </div>
            </div>
        </aside>

        <!-- Main content -->
        <div class="flex flex-col flex-1 overflow-hidden">
            <!-- Top navbar -->
            <header class="bg-white shadow-sm z-10">
                <div class="px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <button class="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
                        <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <div class="flex-1 flex justify-between items-center md:hidden">
                        <h1 class="text-xl font-semibold text-gray-900">@yield('title')</h1>
                    </div>

                    <div class="hidden md:flex md:items-center md:justify-between flex-1">
                        <h1 class="text-xl font-semibold text-gray-900">@yield('title')</h1>

                        <div class="flex items-center space-x-3">
                            <span class="text-gray-700">{{ auth()->user()->name }}</span>
                            <div class="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                                {{ substr(auth()->user()->name, 0, 1) }}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Main content area -->
            <main class="flex-1 overflow-y-auto">
                @yield('content')
            </main>
        </div>
    </div>
</body>
</html>
