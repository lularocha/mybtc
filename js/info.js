document.addEventListener('DOMContentLoaded', () => {
    // Info Panel Logic
    const infoButton = document.getElementById('info');
    const infoPanel = document.getElementById('info-panel');
    const closeInfoPanel = document.getElementById('close-info-panel');

    // Set initial accessibility attributes for info panel
    infoButton.setAttribute('aria-expanded', 'false');
    infoButton.setAttribute('aria-controls', 'info-panel');

    // Function to open the info panel
    function openPanel() {
        infoPanel.classList.add('open');
        infoButton.setAttribute('aria-expanded', 'true');
    }

    // Function to close the info panel
    function closePanel() {
        infoPanel.classList.remove('open');
        infoButton.setAttribute('aria-expanded', 'false');
    }

    // Open panel when info button is clicked
    infoButton.addEventListener('click', openPanel);

    // Support keyboard navigation for info panel
    infoButton.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openPanel();
        }
    });

    // Close panel when close button is clicked
    closeInfoPanel.addEventListener('click', closePanel);

    // Close panel when clicking outside of it
    window.addEventListener('click', (event) => {
        if (!infoPanel.contains(event.target) && event.target !== infoButton) {
            closePanel();
        }
    });

    // Info Modal Logic
    const infoIcon = document.querySelector('.info-icon');
    const infoModal = document.getElementById('info-modal');
    const closeModalBtn = document.getElementById('close-info-modal');

    // Set initial accessibility attributes for info modal
    infoIcon.setAttribute('aria-expanded', 'false');
    infoIcon.setAttribute('aria-controls', 'info-modal');
    infoIcon.setAttribute('tabindex', '0'); // Make icon focusable

    // Function to open the modal
    function openModal() {
        console.log('Opening modal'); // Debug log
        infoModal.style.display = 'block'; // Ensure modal is visible
        setTimeout(() => infoModal.classList.add('is-visible'), 10); // Add class after brief delay for animation
        infoIcon.setAttribute('aria-expanded', 'true');
    }

    // Function to close the modal
    function closeModal() {
        console.log('Closing modal'); // Debug log
        infoModal.classList.remove('is-visible');
        // Wait for animation to complete before hiding
        setTimeout(() => {
            if (!infoModal.classList.contains('is-visible')) {
                infoModal.style.display = 'none';
            }
        }, 300); // Match transition duration
        infoIcon.setAttribute('aria-expanded', 'false');
    }

    // Show modal on mouseover (for desktop)
    infoIcon.addEventListener('mouseover', openModal);

    // Hide modal on mouseout (for desktop)
    infoIcon.addEventListener('mouseout', closeModal);

    // Show modal on click (for non-touch devices)
    infoIcon.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
    });

    // Show modal on tap (for touch devices)
    infoIcon.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent default touch behavior
        console.log('Touchstart triggered'); // Debug log
        openModal();
    });

    // Close modal on close button click
    closeModalBtn.addEventListener('click', closeModal);

    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
        if (!infoModal.contains(e.target) && e.target !== infoIcon) {
            closeModal();
        }
    });

    // Support keyboard navigation for modal
    infoIcon.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && infoModal.classList.contains('is-visible')) {
            closeModal();
        }
    });
});