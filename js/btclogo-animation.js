// document.addEventListener('DOMContentLoaded', () => {
//   const logo = document.querySelector('.mybtclogo');
//   const refreshButton = document.getElementById('refresh');
//   const priceElement = document.getElementById('price');

//   // Function to trigger the spin animation
//   window.spinLogo = function() {
//     logo.classList.remove('spin');
//     requestAnimationFrame(() => {
//       logo.classList.add('spin');
//     });
//   };

//   // Add event listener to the refresh button
//   refreshButton.addEventListener('click', window.spinLogo);

//   // Add event listeners to the price element
//   priceElement.addEventListener('click', window.spinLogo);

//   priceElement.addEventListener('keydown', (event) => {
//     if (event.key === 'Enter' || event.key === ' ') {
//       event.preventDefault();
//       window.spinLogo();
//     }
//   });
// });

document.addEventListener('DOMContentLoaded', () => {
  const logo = document.querySelector('.mybtclogo');
  const refreshButton = document.getElementById('refresh');

  // Function to trigger the spin animation
  window.spinLogo = function() {
    logo.classList.remove('spin');
    requestAnimationFrame(() => {
      logo.classList.add('spin');
    });
  };

  // Add event listener to the refresh button
  refreshButton.addEventListener('click', window.spinLogo);
});