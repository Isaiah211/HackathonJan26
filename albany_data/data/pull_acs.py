import requests
import json

url = "https://api.census.gov/data/2022/acs/acs5"

params = {
    "get": "NAME,B01003_001E,B19013_001E,B23025_005E,B23025_003E",
    "for": "tract:*",
    "in": "state:36 county:083"
    # API key optional
}

response = requests.get(url, params=params)
response.raise_for_status()
data = response.json()

with open("acs_albany_raw.json", "w") as f:
    json.dump(data, f, indent=2)

print("Saved data/acs_albany_raw.json")
