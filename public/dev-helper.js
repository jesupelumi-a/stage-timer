// Development helper for force refresh
// Add this script only in development

if (import.meta.env.DEV) {
  // Listen for Ctrl+Shift+H to force refresh
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'H') {
      console.log('🔄 Force refreshing...');
      window.location.reload(true);
    }
  });

  // Add visual indicator for HMR status
  const hmrIndicator = document.createElement('div');
  hmrIndicator.id = 'hmr-indicator';
  hmrIndicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #00ff00;
    color: white;
    padding: 5px 10px;
    border-radius: 5px;
    font-size: 12px;
    z-index: 9999;
    font-family: monospace;
  `;
  hmrIndicator.textContent = 'HMR ✅';
  document.body.appendChild(hmrIndicator);

  // Listen for HMR updates
  if (import.meta.hot) {
    import.meta.hot.on('vite:beforeUpdate', () => {
      hmrIndicator.style.background = '#ff9900';
      hmrIndicator.textContent = 'HMR 🔄';
    });

    import.meta.hot.on('vite:afterUpdate', () => {
      hmrIndicator.style.background = '#00ff00';
      hmrIndicator.textContent = 'HMR ✅';
    });
  }
}
