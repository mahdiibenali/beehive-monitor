import tkinter as tk
from tkinter import ttk, messagebox
import threading
import time
import json
import random
import requests
import qrcode
from PIL import Image, ImageTk
from datetime import datetime, timezone

# Constants
API_BASE_URL = "https://nahoul.devdata.tn"
HIVES_API = f"{API_BASE_URL}/api/simulator/hives"
PUSH_API = f"{API_BASE_URL}/api/simulator/push"
CHECK_API = f"{API_BASE_URL}/api/simulator/check-gateway"

class SimulatorApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Nahoul Hardware Simulator")
        self.geometry("800x600")
        self.configure(padx=20, pady=20)
        
        # State
        self.hives = []
        self.is_running = False
        self.thread = None
        self.qr_image = None
        
        self.setup_ui()
        self.fetch_hives()
        
    def setup_ui(self):
        # Header
        header = ttk.Label(self, text="Nahoul Hardware Simulator", font=("Segoe UI", 20, "bold"))
        header.pack(anchor="w", pady=(0, 5))
        
        desc = ttk.Label(self, text="Simulates gateway telemetry and pushes to Next.js API.", font=("Segoe UI", 10))
        desc.pack(anchor="w", pady=(0, 20))
        
        # Split layout
        main_frame = ttk.Frame(self)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        left_panel = ttk.LabelFrame(main_frame, text="Simulation Engine", padding=15)
        left_panel.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 10))
        
        right_panel = ttk.LabelFrame(main_frame, text="QR Code Generator", padding=15)
        right_panel.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=(10, 0))
        
        # -- Left Panel (Simulation) --
        interval_frame = ttk.Frame(left_panel)
        interval_frame.pack(fill=tk.X, pady=(0, 15))
        
        ttk.Label(interval_frame, text="Update Interval (sec):").pack(side=tk.LEFT, padx=(0, 10))
        self.interval_var = tk.StringVar(value="120")
        self.interval_entry = ttk.Entry(interval_frame, textvariable=self.interval_var, width=10)
        self.interval_entry.pack(side=tk.LEFT)
        
        self.status_label = ttk.Label(left_panel, text="Status: STOPPED", font=("Segoe UI", 10, "bold"), foreground="red")
        self.status_label.pack(anchor="w", pady=(0, 15))
        
        self.toggle_btn = ttk.Button(left_panel, text="Start Simulation", command=self.toggle_simulation)
        self.toggle_btn.pack(fill=tk.X, pady=(0, 15), ipady=5)
        
        ttk.Label(left_panel, text="Console Logs:").pack(anchor="w")
        
        self.log_text = tk.Text(left_panel, height=15, width=40, font=("Consolas", 9), bg="#1e1e1e", fg="#00ff00")
        self.log_text.pack(fill=tk.BOTH, expand=True)
        
        # -- Right Panel (QR Code) --
        self.generate_btn = ttk.Button(right_panel, text="Generate Gateway QR", command=self.generate_qr)
        self.generate_btn.pack(fill=tk.X, pady=(0, 15), ipady=5)
        
        self.qr_label = ttk.Label(right_panel, background="#ffffff", relief="solid", borderwidth=1)
        self.qr_label.pack(pady=10)
        
        ttk.Label(right_panel, text="Payload (JSON):").pack(anchor="w")
        self.qr_json_text = tk.Text(right_panel, height=8, width=40, font=("Consolas", 9))
        self.qr_json_text.pack(fill=tk.BOTH, expand=True)
        
    def log(self, message):
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.log_text.insert(tk.END, f"[{timestamp}] {message}\n")
        self.log_text.see(tk.END)
        self.update_idletasks()

    def fetch_hives(self):
        self.log("Fetching hives from Next.js backend...")
        try:
            response = requests.get(HIVES_API)
            response.raise_for_status()
            data = response.json()
            
            # Initialize state for each hive
            self.hives = []
            for h in data.get("hives", []):
                self.hives.append({
                    "id": h["id"],
                    "gatewayId": h["gatewayId"],
                    "name": h["name"],
                    "farmName": h["farmName"],
                    "battery_soc": 85.0,
                    "battery_voltage": 3.92,
                    "excitation_voltage": 12.0,
                    "ambient_temp": 22.5,
                    "ambient_humidity": 55.0,
                    "temperature": 34.5,
                    "humidity": 62.1,
                    "pressure": 1013.2,
                })
            self.log(f"Loaded {len(self.hives)} hives.")
        except Exception as e:
            self.log(f"Error fetching hives: {e}")
            messagebox.showerror("Connection Error", f"Could not connect to {HIVES_API}\nEnsure Next.js is running (npm run dev).")

    def toggle_simulation(self):
        if self.is_running:
            self.is_running = False
            self.status_label.config(text="Status: STOPPED", foreground="red")
            self.toggle_btn.config(text="Start Simulation")
            self.interval_entry.config(state="normal")
            self.log("Simulation stopped.")
        else:
            try:
                interval = int(self.interval_var.get())
            except ValueError:
                messagebox.showerror("Error", "Interval must be an integer.")
                return
            
            if len(self.hives) == 0:
                self.fetch_hives()
                
            self.is_running = True
            self.status_label.config(text="Status: RUNNING", foreground="green")
            self.toggle_btn.config(text="Stop Simulation")
            self.interval_entry.config(state="disabled")
            self.log(f"Simulation started. Interval: {interval}s")
            
            self.thread = threading.Thread(target=self.simulation_loop, args=(interval,), daemon=True)
            self.thread.start()

    def vary(self, value):
        multiplier = 1 + (random.uniform(-0.05, 0.05))
        return round(value * multiplier, 2)

    def simulation_loop(self, interval):
        while self.is_running:
            self.log(f"Tick: Generating payloads for {len(self.hives)} hives...")
            success_count = 0
            
            gateways = {}
            for i, hive in enumerate(self.hives):
                gw_id = hive["gatewayId"]
                if gw_id not in gateways:
                    gateways[gw_id] = []
                gateways[gw_id].append((i, hive))
            
            for gw_id, gw_hives in gateways.items():
                if not self.is_running:
                    break
                    
                end_device_data_list = []
                
                for i, hive in gw_hives:
                    # Mutate state
                    self.hives[i]["battery_soc"] = max(0.0, min(100.0, self.vary(hive["battery_soc"])))
                    self.hives[i]["battery_voltage"] = self.vary(hive["battery_voltage"])
                    self.hives[i]["excitation_voltage"] = self.vary(hive.get("excitation_voltage", 12.0))
                    self.hives[i]["ambient_temp"] = self.vary(hive["ambient_temp"])
                    self.hives[i]["ambient_humidity"] = self.vary(hive["ambient_humidity"])
                    self.hives[i]["temperature"] = self.vary(hive["temperature"])
                    self.hives[i]["humidity"] = self.vary(hive["humidity"])
                    self.hives[i]["pressure"] = self.vary(hive["pressure"])
                    
                    h = self.hives[i]
                    end_device_data_list.append({
                        "device_id": h["id"],
                        "device_timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                        "sensors": {
                            "temperature": h["temperature"],
                            "humidity": h["humidity"],
                            "pressure": h["pressure"],
                            "position": "fixed"
                        },
                        "ai_analysis": {
                            "bee_status_code": 1,
                            "bee_status_label": "Healthy/Normal",
                            "activity_level": "High"
                        }
                    })
                
                first_hive = self.hives[gw_hives[0][0]]
                
                # Build payload
                payload = {
                    "gateway_id": gw_id,
                    "gateway_timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                    "gateway_location": {
                        "lat": 36.8665 + random.uniform(-0.001, 0.001),
                        "lng": 10.1647 + random.uniform(-0.001, 0.001),
                        "alt": 45.0
                    },
                    "power_system": {
                        "battery_soc": first_hive["battery_soc"],
                        "battery_voltage": first_hive["battery_voltage"],
                        "charging_status": "Solar Charging",
                        "input_source": "VBUS_Solar",
                        "temperature_c": first_hive["ambient_temp"]
                    },
                    "environment": {
                        "ambient_temp": first_hive["ambient_temp"],
                        "ambient_humidity": first_hive["ambient_humidity"]
                    },
                    "venom_module": {
                        "grid_status": "Active",
                        "grid_integrity": "OK",
                        "excitation_voltage": first_hive.get("excitation_voltage", 12.0),
                        "Grid default": "breakdown"
                    },
                    "end_device_data": end_device_data_list
                }
                
                try:
                    res = requests.post(PUSH_API, json=payload, timeout=5)
                    if res.status_code == 200:
                        success_count += 1
                except Exception as e:
                    self.log(f"Failed to push {gw_id}: {e}")
                    
            self.log(f"Tick completed. Pushed {success_count} gateway updates.")
            
            # Sleep for interval
            for _ in range(interval * 10):
                if not self.is_running:
                    break
                time.sleep(0.1)

    def generate_qr(self):
        self.log("Generating Gateway QR Code... Checking uniqueness in database...")
        # Generate full telemetry JSON as per user request
        gateway_id = None
        
        # Keep generating until we find one that doesn't exist in the DB!
        while True:
            candidate = f"GW_MASTER_{random.randint(100, 999)}"
            try:
                res = requests.get(f"{CHECK_API}?id={candidate}", timeout=5)
                if res.status_code == 200:
                    data = res.json()
                    if data.get("exists"):
                        self.log(f"ID {candidate} already exists in DB. Retrying...")
                        continue
            except Exception as e:
                self.log(f"Could not verify uniqueness: {e}")
            
            # If we reach here, it's unique (or verification failed, so we proceed)
            gateway_id = candidate
            break
            
        data = {
            "gateway_id": gateway_id,
            "gateway_timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "gateway_location": {
                "lat": round(36.8665 + random.uniform(-0.01, 0.01), 4),
                "lng": round(10.1647 + random.uniform(-0.01, 0.01), 4),
                "alt": 45.0
            },
            "power_system": {
                "battery_soc": 85,
                "battery_voltage": 3.92,
                "charging_status": "Solar Charging",
                "input_source": "VBUS_Solar",
                "temperature_c": 28.4
            },
            "environment": {
                "ambient_temp": 22.5,
                "ambient_humidity": 55.0
            },
            "venom_module": {
                "grid_status": "Active",
                "grid_integrity": "OK",
                "excitation_voltage": 12.0,
                "Grid default": "breakdown"
            },
            "end_device_data": {
                "device_id": f"HIVE_{random.randint(100, 999)}",
                "device_timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                "sensors": {
                    "temperature": 34.5,
                    "humidity": 62.1,
                    "pressure": 1013.2,
                    "position": "fixed"
                },
                "ai_analysis": {
                    "bee_status_code": 1,
                    "bee_status_label": "Healthy/Normal",
                    "activity_level": "High"
                }
            }
        }
        
        # 1. Post the massive payload to the server behind the scenes
        try:
            res = requests.post(PUSH_API, json=data, timeout=5)
            if res.status_code == 200:
                self.log(f"Pre-registered {gateway_id} data with server.")
            else:
                self.log(f"Failed to pre-register data: {res.status_code}")
        except Exception as e:
            self.log(f"API Error during QR Generation: {e}")

        # 2. Generate a tiny QR code containing only the ID!
        qr_data = {
            "gateway_id": gateway_id
        }
        json_str = json.dumps(qr_data, indent=2)
        
        self.qr_json_text.delete("1.0", tk.END)
        self.qr_json_text.insert(tk.END, json_str)
        
        # Generate QR
        qr = qrcode.QRCode(version=1, box_size=5, border=2)
        qr.add_data(json_str)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to PhotoImage
        self.qr_image = ImageTk.PhotoImage(img)
        self.qr_label.config(image=self.qr_image)
        self.qr_label.image = self.qr_image
        
        self.log("Generated new Gateway QR Code.")

if __name__ == "__main__":
    app = SimulatorApp()
    
    # Configure custom styles
    style = ttk.Style()
    if "vista" in style.theme_names():
        style.theme_use("vista")
        
    app.mainloop()
