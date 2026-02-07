# QXW File Processor - Magic JS

## 🎨 Akai APC Mini MK2 LED Synchronization with QLC+

Web application to automatically synchronize **LED colors** on the **Akai APC Mini MK2** controller with button colors in the **QLC+ Virtual Console**.

It is not magic, but **magicjs**

## Description

This software analyzes QLC+ workspace files (.qxw) and automatically configures MIDI values so that the Akai APC Mini MK2 controller LEDs display the same colors as the associated buttons in the Virtual Console graphical interface.

**Problem solved:** When you create a Virtual Console in QLC+ and map the buttons to the Akai APC Mini MK2 controller, the controller LEDs don't automatically reflect the colors you set in the interface. This tool solves the problem by automatically mapping the colors.

**How it works:**
- Load the QLC+ workspace file (.qxw)
- The system reads the button colors in the Virtual Console
- Finds the closest MIDI color for each button
- Automatically configures MIDI parameters to light up the controller LEDs
- Download the modified file ready to use

### What it does

The system processes QXW files (QLC+ workspace) and for each button:
1. Extracts the background color from the `Button/Appearance/BackgroundColor` element
2. Converts the numeric color value to hexadecimal format
3. Finds the closest MIDI color using RGB Euclidean distance
4. If the Input channel is between 128 and 191, updates the MIDI attributes:
   - `LowerValue`, `UpperValue`, `MonitorValue` = found color value
   - `LowerParams` = configurable (default: 6 - On 100% brightness)
   - `UpperParams` = configurable (default: 11 - Blinking 1/24)
   - `MonitorParams` = same as UpperParams

### MIDI Parameters Configuration

The application allows you to configure LED behavior through dropdown menus:

**Lower Params (Button Press):** Controls LED brightness/animation when button is pressed
- Default: On 100% brightness

**Upper/Monitor Params (LED State):** Controls LED brightness/animation for button state
- Default: Blinking 1/24

Available options:
- Brightness: 10%, 25%, 50%, 65%, 75%, 90%, 100%
- Pulsing: 1/16, 1/8, 1/4, 1/2
- Blinking: 1/24, 1/16, 1/8, 1/4, 1/2

## Project Structure

```
magicjs/
├── index.html      # HTML interface
├── style.css       # CSS styles
├── script.js       # Main logic and XML processing
└── colors.js       # MIDI colors array (from midi_val.py)
```

## How to Use

1. Open `index.html` in your browser
2. Load a `.qxw` file via:
   - Click on the upload box
   - Drag & drop the file
3. **Configure MIDI Parameters** (optional):
   - **Lower Params**: Set LED behavior when button is pressed
   - **Upper/Monitor Params**: Set LED behavior for button state
4. Click "⚙️ Process" to process the file
5. Click "📥 Download Modified File" to save the processed file

The downloaded file will have the suffix `_modified` (e.g., `workspace_modified.qxw`)

## License

MIT License - see [LICENSE](LICENSE) file for details.
