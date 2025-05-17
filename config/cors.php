<?php

return [
  'paths' => ['api/*', 'sanctum/csrf-cookie'],
  'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  'allowed_origins' => ['*'],  // This is acceptable for mobile app backends
  'allowed_origins_patterns' => [],
  'allowed_headers' => ['Content-Type', 'X-Requested-With', 'Authorization', 'Accept'],
  'exposed_headers' => [],
  'max_age' => 86400, // 24 hours
  'supports_credentials' => false,
];
