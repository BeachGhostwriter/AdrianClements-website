# Neptune Water Intelligence Platform

Industrial water management & sustainability investment decision support.
Built with Python + Streamlit. Demo case: Bremen Steel Works.

## Quick Start (local)

```bash
pip install -r requirements.txt
streamlit run Home.py
```

Or double-click **launch_neptune.bat** on Windows.

## Pages

| Page | Purpose |
|---|---|
| Country & Region | Water stress map, regulatory discharge limits by country |
| Company Data | Water flow balance, source breakdown, contaminant concentrations |
| Flow Diagram | Sankey water flow diagram with contaminant concentrations |
| Treatment Solutions | Technology selection, contaminant removal chain, compliance check |
| Cost Estimation | SAP-coded cost library, import/export |
| EBITDA Bridge | Value creation waterfall chart |
| CapEx / OpEx | Multi-year investment plan, NPV, IRR, optimisation |

## Deployment — Streamlit Community Cloud (free, shareable link)

1. Push this folder to a **public GitHub repository**
2. Go to [share.streamlit.io](https://share.streamlit.io) and sign in with GitHub
3. Click **New app** → select your repo → set Main file = `Home.py`
4. Click **Deploy** — your app gets a public URL like `https://yourname-neptune.streamlit.app`

## Requirements

- Python 3.10+
- See requirements.txt
