import pandas as pd
import os
import xml.etree.ElementTree as ET

from pathlib import Path

def rs_df_converter(rs_base_path):
    
    df_data = {'File':[], 'Object_Name':[], 'Identifier':[], 'Value':[]}
    # Walk and collect .rs files
    for base, _, rs_nested_file in os.walk(rs_base_path):
        for rs_file in rs_nested_file:
            if rs_file.lower().endswith(".rs"):
                df_data["File"].append(os.path.join(os.path.abspath(base), rs_file))

    # ⬇️ Minimal change: create a DataFrame and iterate using iterrows()
    files_df = pd.DataFrame({'File': df_data['File']})
    for _, row in files_df.iterrows():
        rs_file = row['File']
        obj_name = Path(rs_file).stem
        try:
            root_xml  = ET.parse(rs_file)
            sel_coll = root_xml.find(".//selectorCollection")
            if sel_coll is None:
                continue
            """
            Upgrade this part to take options other than xpath as well
            """
            for entry in sel_coll.findall("./entry"):
                key = (entry.findtext("key") or "").strip()
                value = (entry.findtext("value") or "").strip()
                if not key or not value:
                    continue
                if key.lower() != "xpath":
                    continue
                if key.lower() == "xpath":
                    df_data["Identifier"].append("XPATH")
                    df_data["Value"].append(value)
                    df_data["Object_Name"].append(obj_name)
                    break
        except ET.ParseError as e:
            print(f"XML parse error in {rs_file}: {e}")
        except Exception as e:
            print(f"Could not read {rs_file}: {e}")

    return pd.DataFrame(data=df_data)


if __name__ == "__main__":
    print(rs_df_converter("Object Repository").head())