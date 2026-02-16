# Getting Started

## What to Upload

Credo Analytics supports the following file formats, which you can export directly from your Credo Bank account:

* **.XLSX (Excel)**: Recommended for detailed transaction data.
* **.PDF**: Bank statements in PDF format.
* **.CSV**: Comma-separated values (if available).

> [!TIP]
> You can upload **multiple files at once**. Whether you have monthly statements for the past year or multiple accounts, drag them all into the upload zone together. The application will automatically merge and deduplicate transactions.

## How to Upload

1. **Locate your files**: Ensure you have your exported bank statements ready on your device.
2. **Drag & Drop**: Simply drag the file(s) from your file explorer and drop them onto the upload area.
3. **Or Click to Browse**: Click the upload button to open your system's file picker and select the files you wish to analyze.

The application will instantly parse the files and present your dashboard.

## Privacy & Security

We understand that financial data is sensitive. That's why Credo Analytics is built with a **Local-First** architecture.

### How it works
* **No Server Uploads**: When you "upload" a file, it is read directly by your web browser using JavaScript. The file contents never leave your computer.
* **No Database**: There is no backend database storing your transactions. Everything resides in your browser's temporary memory or local storage.
* **Offline Capable**: Once the page is loaded, you can disconnect from the internet and the application will continue to function perfectly.

### How to Verify
To prove that your data is safe, you can try this simple test:
1. Open Credo Analytics.
2. **Disconnect your internet** (turn off Wi-Fi or unplug your Ethernet cable).
3. Upload your bank statements.
4. Watch as the dashboard populates and analysis works flawlessly—without any network connection!

### Clearing Data
If you want to remove all traces of your data from the browser, simply click the **Reset Data** (Trash Icon) button in the dashboard header. This will wipe the local storage and return the app to its initial state.
