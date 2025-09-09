import './TestButton.css';

export const createTestButton = ({ label = 'Test Button', disabled = false, onClick } = {}) => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'test-button';
  btn.innerText = label;
  btn.disabled = disabled;
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
};

