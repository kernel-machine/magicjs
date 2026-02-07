// State management
const state = {
    originalFile: null,
    processedFile: null,
    originalFileName: ''
};

// DOM Elements
const xmlFileInput = document.getElementById('xmlFile');
const fileLabel = document.getElementById('fileLabel');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const processBtn = document.getElementById('processBtn');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const statusMessage = document.getElementById('statusMessage');
const lowerParamsSelect = document.getElementById('lowerParams');
const upperMonitorParamsSelect = document.getElementById('upperMonitorParams');

// Drag and drop functionality
fileLabel.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileLabel.classList.add('dragover');
});

fileLabel.addEventListener('dragleave', () => {
    fileLabel.classList.remove('dragover');
});

fileLabel.addEventListener('drop', (e) => {
    e.preventDefault();
    fileLabel.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        xmlFileInput.files = files;
        handleFileSelect();
    }
});

// File input change event
xmlFileInput.addEventListener('change', handleFileSelect);

function handleFileSelect() {
    const file = xmlFileInput.files[0];
    if (file) {
        if (!file.name.endsWith('.qxw')) {
            showStatus('Please load a valid QXW file', 'error');
            xmlFileInput.value = '';
            return;
        }

        state.originalFile = file;
        state.originalFileName = file.name;
        fileName.textContent = file.name;
        fileSize.textContent = (file.size / 1024).toFixed(2) + ' KB';
        fileInfo.classList.add('show');
        processBtn.disabled = false;
        downloadBtn.disabled = true;
        state.processedFile = null;
        showStatus(`File "${file.name}" loaded successfully`, 'success');
    }
}

// Process button click
processBtn.addEventListener('click', async () => {
    if (!state.originalFile) {
        showStatus('Please load a file first', 'error');
        return;
    }

    try {
        processBtn.disabled = true;
        showStatus('Processing...', 'info');

        // Read the file
        const fileContent = await readFileAsText(state.originalFile);

        // Get selected MIDI parameters
        const lowerParams = lowerParamsSelect.value;
        const upperMonitorParams = upperMonitorParamsSelect.value;

        // Process the XML
        const modifiedContent = processXmlFile(fileContent, lowerParams, upperMonitorParams);

        // Store the processed file
        state.processedFile = modifiedContent;

        downloadBtn.disabled = false;
        showStatus('File processed successfully!', 'success');
    } catch (error) {
        showStatus('Error during processing: ' + error.message, 'error');
    } finally {
        processBtn.disabled = false;
    }
});

// Download button click
downloadBtn.addEventListener('click', () => {
    if (!state.processedFile) {
        showStatus('No file to download', 'error');
        return;
    }

    downloadFile(state.processedFile, state.originalFileName);
    showStatus('Download started!', 'success');
});

// Reset button click
resetBtn.addEventListener('click', () => {
    xmlFileInput.value = '';
    state.originalFile = null;
    state.processedFile = null;
    state.originalFileName = '';
    fileInfo.classList.remove('show');
    processBtn.disabled = true;
    downloadBtn.disabled = true;
    statusMessage.classList.remove('show');
    showStatus('Reset complete', 'info');
});

// ============================================
// XML PROCESSING LOGIC (from magic.py)
// ============================================

/**
 * Calculate the Euclidean distance between two RGB colors
 * @param {string} color1 - Color 1 in hex format (e.g., "ff0000")
 * @param {string} color2 - Color 2 in hex format (e.g., "00ff00")
 * @returns {number} Euclidean distance between the two colors
 */
function euclideanDistance(color1, color2) {
    const r1 = parseInt(color1.substring(0, 2), 16);
    const g1 = parseInt(color1.substring(2, 4), 16);
    const b1 = parseInt(color1.substring(4, 6), 16);
    
    const r2 = parseInt(color2.substring(0, 2), 16);
    const g2 = parseInt(color2.substring(2, 4), 16);
    const b2 = parseInt(color2.substring(4, 6), 16);
    
    return Math.sqrt(
        Math.pow(r1 - r2, 2) + 
        Math.pow(g1 - g2, 2) + 
        Math.pow(b1 - b2, 2)
    );
}

/**
 * Find the closest color in the colors array
 * @param {string} hexColor - Color in hex format (without #)
 * @returns {object|null} The closest color from the colors array
 */
function findCloserColor(hexColor) {
    let closerColor = null;
    let minDiff = Infinity;
    
    for (const color of colors) {
        const colorRgb = color.RGB.substring(1); // Rimuove il #
        const diff = euclideanDistance(hexColor, colorRgb);
        
        if (diff < minDiff) {
            minDiff = diff;
            closerColor = color;
        }
    }
    
    return closerColor;
}

/**
 * Extract the background color value from a Button element
 * @param {Element} button - Button element from the XML DOM
 * @returns {string|null} The closest color value or null
 */
function getBgColor(button) {
    const appearance = button.querySelector('Appearance');
    if (appearance) {
        const bgColor = appearance.querySelector('BackgroundColor');
        if (bgColor) {
            const colorValue = bgColor.textContent;
            // Check if it's a number
            if (/^\d+$/.test(colorValue)) {
                // Convert to hex as Python does: hex(int(value))[4:]
                const hexValue = parseInt(colorValue).toString(16);
                // Python does hex()[4:] which ignores '0x' and takes only the last 6 digits for ARGB
                const hexColor = hexValue.length > 6 ? hexValue.substring(hexValue.length - 6) : hexValue.padStart(6, '0');
                const closerColor = findCloserColor(hexColor);
                return closerColor ? closerColor.value : null;
            }
        }
    }
    return null;
}

/**
 * Modify the XML file content
 * Implements the same logic as magic.py:
 * - Find all Buttons
 * - For each Button, extract the background color
 * - If the Input channel is between 128 and 191, modify the MIDI values
 * 
 * @param {string} xmlContent - The XML content to modify
 * @param {string} lowerParams - Value for LowerParams attribute
 * @param {string} upperMonitorParams - Value for UpperParams and MonitorParams attributes
 * @returns {string} The modified XML content
 */
function processXmlFile(xmlContent, lowerParams = '6', upperMonitorParams = '11') {
    // Parse the XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    
    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
        throw new Error('XML parsing error: ' + parserError.textContent);
    }
    
    // Find all Buttons
    const buttons = xmlDoc.querySelectorAll('Button');
    
    // Process each button
    buttons.forEach(button => {
        const colorId = getBgColor(button);
        
        if (colorId !== null) {
            // Find the Input element
            const input = button.querySelector('Input');
            
            if (input) {
                const channel = parseInt(input.getAttribute('Channel'));
                
                // Check if the channel is between 128 and 191
                if (channel >= 128 && channel <= 191) {
                    // Modify attributes with user-selected parameters
                    input.setAttribute('LowerValue', colorId);
                    input.setAttribute('UpperValue', colorId);
                    input.setAttribute('MonitorValue', colorId);
                    
                    input.setAttribute('LowerParams', lowerParams);
                    input.setAttribute('UpperParams', upperMonitorParams);
                    input.setAttribute('MonitorParams', upperMonitorParams);
                }
            }
        }
    });
    
    // Serialize the modified XML
    const serializer = new XMLSerializer();
    return serializer.serializeToString(xmlDoc);
}
// ============================================

// Utility functions
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('File reading error'));
        reader.readAsText(file);
    });
}

function downloadFile(content, originalFileName) {
    const element = document.createElement('a');
    // Replace both .xml and .qxw with _modified
    const fileName = originalFileName.replace(/\.(xml|qxw)$/i, '_modified.$1');
    element.setAttribute('href', 'data:text/xml;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', fileName);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message show ${type}`;
    
    // Auto-hide after 5 seconds (except for errors)
    if (type !== 'error') {
        setTimeout(() => {
            statusMessage.classList.remove('show');
        }, 5000);
    }
}
