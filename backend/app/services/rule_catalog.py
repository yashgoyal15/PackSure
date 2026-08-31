"""
The fixed set of declaration categories every inspection is screened against,
per SRS Section 7.1 ("Initial Rule Categories"). IDs match the frontend's
`RULE_CATALOG` in `src/data/mockData.js` exactly so the API response can be
consumed without any field-name translation on the client.
"""

RULE_CATALOG = [
    {"id": "product_name", "label": "Product / Common Name"},
    {"id": "manufacturer", "label": "Manufacturer / Packer / Importer"},
    {"id": "address", "label": "Address"},
    {"id": "net_quantity", "label": "Net Quantity"},
    {"id": "mrp", "label": "MRP Declaration"},
    {"id": "mfg_info", "label": "Manufacturing / Packing / Import Info"},
    {"id": "consumer_care", "label": "Consumer Care Details"},
    {"id": "country_of_origin", "label": "Country of Origin"},
    {"id": "readability", "label": "Readability / Font Prominence"},
]

RULE_LABELS = {r["id"]: r["label"] for r in RULE_CATALOG}
