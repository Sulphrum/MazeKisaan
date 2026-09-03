# माझे Kisan Windows setup

This guide runs माझे Kisan locally on Windows 10 or Windows 11. The clean project ZIP intentionally excludes installed dependencies so Windows can install the correct native versions.

## 1. Install the required software

Install:

- Node.js 22 LTS or a compatible Node.js 22 release
- Python 3.13 or 3.14, 64-bit

During Python installation, enable the option to add Python to PATH and install the Python launcher. Close and reopen PowerShell after installing either tool.

Check the installations:

```powershell
node --version
npm --version
py --version
```

## 2. Extract the project

Extract the ZIP to a normal writable folder such as:

```text
C:\Users\YourName\Documents\माझे Kisan
```

Avoid running the project from inside the ZIP, OneDrive synchronization conflicts, or a protected system directory.

Open the extracted folder in File Explorer. Click the address bar, type `powershell`, and press Enter.

## 3. Install JavaScript dependencies

```powershell
npm install
```

This creates `node_modules` specifically for Windows. It may take several minutes and requires internet access the first time.

## 4. Set up the ML service

For Python 3.13:

```powershell
py -3.13 -m venv ml\.venv
ml\.venv\Scripts\python.exe -m pip install --upgrade pip
ml\.venv\Scripts\python.exe -m pip install -r ml\requirements.txt
```

For Python 3.14, use `py -3.14` in the first command. The remaining commands stay the same.

## 5. Run माझे Kisan

Keep two PowerShell windows open.

In the first window, run the ML service:

```powershell
ml\.venv\Scripts\python.exe -m uvicorn api:app --app-dir ml --host 127.0.0.1 --port 8000
```

In the second window, run the application:

```powershell
npm run dev
```

Open this address in Chrome or Edge:

```text
http://localhost:8443
```

Use `Ctrl+C` in each PowerShell window to stop the services.

## Demo sign-in

- Farmer: `98220 14589` / `password123`
- Buyer: `sunil@deccanfresh.com` / `password123`

## Running without ML

You may skip the Python setup and run only `npm install` followed by `npm run dev`. Core screens and the Express API will work, but ML-backed requests may use prototype fallback results.

## Common Windows problems

### PowerShell script execution error for npm

Use Command Prompt for `npm install` and `npm run dev`, or run the executable form:

```powershell
npm.cmd install
npm.cmd run dev
```

### The requested Python version is not found

List installed versions:

```powershell
py -0p
```

Use an installed 64-bit Python 3.13 or 3.14 version in the environment command.

### Port 8443 is already in use

```powershell
$env:PORT=8444
npm run dev
```

Then open `http://localhost:8444`.

### Port 8000 is already in use

The application currently expects the ML service at port 8000. Stop the other program using that port before starting the ML service.

### Dependency errors after receiving an updated copy

Close the development server, delete the local `node_modules` folder and `ml\.venv` folder using File Explorer, then repeat sections 3 and 4. Do not copy those folders from macOS.

### Windows Defender or antivirus delays installation

Dependency folders contain many small files, so first-time scanning can be slow. Allow the installation to finish; do not disable security protection.
