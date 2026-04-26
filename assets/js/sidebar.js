// This file is part of OpenSparrow - https://opensparrow.org
// Licensed under LGPL v3. See LICENCE file for details.

document.addEventListener('DOMContentLoaded', () => {
    const toggle  = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('menu');
    if (!toggle || !sidebar) return;

    toggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        localStorage.setItem('menuCollapsed', sidebar.classList.contains('collapsed'));
    });

    const saved = localStorage.getItem('menuCollapsed');
    if (saved === 'true') {
        sidebar.classList.add('collapsed');
    } else if (saved === 'false' || saved === null) {
        sidebar.classList.remove('collapsed');
    }
});
