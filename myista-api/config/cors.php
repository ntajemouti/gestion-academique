<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Allows the React frontend running on localhost:5173 to communicate with
    | this Laravel API. Adjust `allowed_origins` for production domains.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:5173',   // Vite dev server
        'http://localhost:3000',   // CRA fallback
        'http://127.0.0.1:5173',
        // Add your production domain here, e.g.:
        // 'https://myista.example.com',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    /*
     * Set to true so that Sanctum cookies (session-based auth) work
     * cross-origin. Required for SPA cookie auth; harmless when using tokens.
     */
    'supports_credentials' => true,

];
