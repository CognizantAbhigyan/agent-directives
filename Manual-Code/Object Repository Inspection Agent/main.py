from pathlib import Path
import csv
import xml.etree.ElementTree as ET
from collections import defaultdict

def extract_rs_file_data(folder_path, output_dir, only_xpath=True):
    root = Path(folder_path)
    if not root.is_dir():
        print("Invalid folder path!")
        return

    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    file_name = root.name or "output"
    details_path = output_dir / f"{file_name}.csv"
    counts_path = output_dir / f"{file_name}_counter.csv"

    
    all_dirs = set()
    children_map = defaultdict(list)
    direct_counts = defaultdict(int)
    rs_files = []

    for current_dir, subdirs, files in _walk(root):
        all_dirs.add(current_dir)
        for sd in subdirs:
            child = current_dir / sd
            all_dirs.add(child)
            children_map[current_dir].append(child)
        for fn in files:
            if fn.lower().endswith(".rs"):
                fp = current_dir / fn
                rs_files.append(fp)
                direct_counts[current_dir] += 1

    if not rs_files:
        print("No .rs files found in the specified folder.")
        return

    
    recursive_counts = {}
    def dfs_count(d: Path) -> int:
        if d in recursive_counts:
            return recursive_counts[d]
        total = direct_counts.get(d, 0)
        for c in children_map.get(d, []):
            total += dfs_count(c)
        recursive_counts[d] = total
        return total

    for d in all_dirs:
        dfs_count(d)

    
    with counts_path.open('w', newline='', encoding='utf-8-sig') as f_counts:
        writer = csv.writer(f_counts)
        writer.writerow(['Folder', 'RS_Files_Count'])
        for d in sorted(all_dirs, key=lambda p: p.as_posix()):
            writer.writerow([d.resolve().as_posix(), recursive_counts.get(d, 0)])

    
    rows_written = 0
    with details_path.open('w', newline='', encoding='utf-8-sig') as f_details:
        writer = csv.writer(f_details)
        writer.writerow(['File', 'Object_Name', 'Identifier', 'Value'])

        for file_path in rs_files:
            obj_name = file_path.stem
            abs_file = file_path.resolve().as_posix()

            try:
                root_xml = ET.parse(file_path).getroot()
                sel_coll = root_xml.find(".//selectorCollection")
                if sel_coll is None:
                    continue

                for entry in sel_coll.findall("./entry"):
                    key = (entry.findtext("key") or "").strip()
                    value = (entry.findtext("value") or "").strip()
                    if not key or not value:
                        continue
                    if only_xpath and key.lower() != "xpath":
                        continue
                    writer.writerow([abs_file, obj_name, key, value])
                    rows_written += 1

            except ET.ParseError as e:
                print(f"XML parse error in {abs_file}: {e}")
            except Exception as e:
                print(f"Could not read {abs_file}: {e}")

    print(f"Done. Details rows written: {rows_written}")
    print(f"Details CSV: {details_path.resolve().as_posix()}")
    print(f"Counts  CSV: {counts_path.resolve().as_posix()}")


def _walk(root: Path):
    for p in root.rglob("*"):
        
        if p.is_dir():
            subdirs = [d.name for d in p.iterdir() if d.is_dir()]
            files = [f.name for f in p.iterdir() if f.is_file()]
            yield p, subdirs, files
    
    if root not in [d for d, _, _ in []]:
        subdirs = [d.name for d in root.iterdir() if d.is_dir()] if root.exists() else []
        files = [f.name for f in root.iterdir() if f.is_file()] if root.exists() else []
        yield root, subdirs, files


if __name__ == "__main__":
    extract_rs_file_data(
        folder_path="Object Repository",
        output_dir="Output",
        only_xpath=True
    )