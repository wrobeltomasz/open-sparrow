<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>404 – Page Not Found | Sparrow</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link href="/assets/css/styles.css" rel="stylesheet" />
    <link rel="icon" type="image/x-icon" href="favicon.ico">
    <style>
        .error-page {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 70vh;
            text-align: center;
            gap: 1.5rem;
            padding: 2rem;
        }
        .error-page h1 {
            font-size: 6rem;
            font-weight: 700;
            color: var(--accent);
            margin: 0;
            line-height: 1;
        }
        .error-page h2 {
            font-size: 1.5rem;
            margin: 0;
        }
        .error-page p {
            color: var(--muted, #6b7280);
            margin: 0;
        }
        .btn-home {
            margin-top: 0.5rem;
            padding: 0.65rem 1.5rem;
            font-size: 1rem;
        }
    </style>
</head>
<body>

<header>
    <a href="index.php" class="brand-logo">
        <img src="assets/img/logo-blue.png" alt="Sparrow Logo" />
    </a>
</header>

<main>
    <div class="error-page">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you are looking for does not exist or has been moved.</p>
        <a href="index.php">
            <button class="btn-home">Go Back to Home</button>
        </a>
    </div>
</main>

<footer>
    <div class="footer-content">
        <small>
            <a href="https://opensparrow.org/">OpenSparrow.org</a> | Open source | LGPL v3. | PHP + vanilla JS + Postgres!
        </small>
    </div>
</footer>

</body>
</html>
