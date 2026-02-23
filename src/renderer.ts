import './index.css';

const API = 'http://127.0.0.1:9100';

const statusDot = document.getElementById('status-dot')!;
const statusText = document.getElementById('status-text')!;
const printerSelect = document.getElementById('printer-select') as HTMLSelectElement;
const pdfInput = document.getElementById('pdf-input') as HTMLInputElement;
const pdfLabel = document.getElementById('pdf-label')!;

async function checkHealth() {
  try {
    const res = await fetch(`${API}/health`);
    if (res.ok) {
      statusDot.className = 'status-dot ok';
      statusText.textContent = 'Server running on port 9100';
    } else {
      throw new Error();
    }
  } catch {
    statusDot.className = 'status-dot error';
    statusText.textContent = 'Server not responding';
  }
}

async function loadPrinters() {
  printerSelect.innerHTML = '<option value="" disabled selected>Loading...</option>';
  try {
    const res = await fetch(`${API}/printers`);
    const data = await res.json();
    const printers: { name: string }[] = data.printers;

    if (printers.length === 0) {
      printerSelect.innerHTML = '<option value="" disabled selected>No printers found</option>';
      return;
    }

    printerSelect.innerHTML = '';
    for (const p of printers) {
      const option = document.createElement('option');
      option.value = p.name;
      option.textContent = p.name;
      printerSelect.appendChild(option);
    }
  } catch {
    printerSelect.innerHTML = '<option value="" disabled selected>Failed to load printers</option>';
  }
}

function refresh() {
  checkHealth();
  loadPrinters();
}

pdfInput.addEventListener('change', () => {
  const file = pdfInput.files?.[0];
  pdfLabel.textContent = file ? file.name : 'Default sample';
});

document.getElementById('print-btn')!.addEventListener('click', () => {
  const printer = printerSelect.value;
  if (!printer) {
    alert('Please select a printer first.');
    return;
  }
  const file = pdfInput.files?.[0];
  const filePath: string | undefined = file ? (file as any).path : undefined;
  (window as any).electronAPI.printTest(printer, filePath);
});

document.getElementById('refresh-btn')!.addEventListener('click', refresh);

refresh();
